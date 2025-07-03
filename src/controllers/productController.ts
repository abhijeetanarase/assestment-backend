import { Request, Response } from "express";
import Product from "../models/productModel";
import cloudinary from "../configs/cloudinary";
import { parseFileBuffer } from "../utils/parseFile";




export const addProduct = async(req: Request, res: Response) => {
    const { name, description, price, category, stock, status } = req.body;
    const file = req.file; // Multer should provide this

    if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        let imageUrl = "";

        if (file && file.buffer) {
            // Upload file buffer to Cloudinary using upload_stream
            imageUrl = await new Promise<string>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "products" },
                    (error, result) => {
                        if (error || !result) {
                            reject(error || new Error("Cloudinary upload failed"));
                        } else {
                            resolve(result.secure_url);
                        }
                    }
                );
                // Pipe the buffer to the stream
                stream.end(file.buffer);
            });
        }

        // Now you can use imageUrl in your product creation
        const product = new Product({
            name,
            description,
            price,
            category,
            imageUrl,
            stock,
            status // add status here
        });

        await product.save();
        return res.status(201).json({ message: "Product added successfully", product });
    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}



 export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Product.distinct("category");
        return res.status(200).json({ categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}





export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      priceMin,
      priceMax,
      stockMin,
      stockMax,
      category,
      lowStock,
      outOfStock,
      highStock,
      medStock,
      search,
      sortBy = "createdAt", 
      order = "desc",       
      page = 1,
      limit = 10,
      status,
    } = req.query;

    const matchStage: any = {};
  
    // अगर यूजर का रोल 'user' है तो सिर्फ active products दिखाएं और status query को इग्नोर करें
    if ((req as any).role === 'user') {
      matchStage.status = 'active';
    } else {
    
      if (status) {
        matchStage.status = status;
      }
    }

    // Price filter
    if (priceMin || priceMax) {
      matchStage.price = {};
      if (priceMin) matchStage.price.$gte = Number(priceMin);
      if (priceMax) matchStage.price.$lte = Number(priceMax);
    }

    // Stock filter
    if (stockMin || stockMax) {
      matchStage.stock = {};
      if (stockMin) matchStage.stock.$gte = Number(stockMin);
      if (stockMax) matchStage.stock.$lte = Number(stockMax);
    }

    // Derived filters
    if (lowStock === "true") {
      matchStage.stock = { ...matchStage.stock, $lte: 10 };
    }

    if (medStock === "true") {
      matchStage.stock = { ...matchStage.stock, $lte: 20, $gt: 10 };
        
    }

    if (highStock === "true") {
      matchStage.stock = { ...matchStage.stock, $gt: 20 };
        
    }

    if (outOfStock === "true") {
      matchStage.stock = { ...matchStage.stock, $eq: 0 };
    }

   
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      matchStage.category = { $in: categories };
    }

  
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ];
    }

    // Sorting
    const allowedSortFields = ["price", "name", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy as string) ? String(sortBy) : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    // Pagination
    const pageNumber = parseInt(page as string) || 1;
    const pageLimit = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageLimit;


    const pipeline: any[] = [
      { $match: matchStage },
      {
        $addFields: {
          stockStatus: {
            $switch: {
              branches: [
                { case: { $eq: ["$stock", 0] }, then: "OutOfStock" },
                { case: { $lte: ["$stock", 10] }, then: "Low" },
                { 
                  case: { 
                    $and: [
                      { $gt: ["$stock", 10] },
                      { $lte: ["$stock", 20] }
                    ] 
                  }, 
                  then: "Medium" 
                },
                { 
                  case: { $gt: ["$stock", 20] }, 
                  then: "High" 
                }
              ],
              
              default: "High",
            },
          },
          isOutOfStock: { $eq: ["$stock", 0] },
        },
      },
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: pageLimit }
    ];

    // Count total for pagination
    const totalCountPipeline: any[] = [{ $match: matchStage }, { $count: "total" }];
    const [products, totalCountResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(totalCountPipeline),
    ]);

    const total = totalCountResult[0]?.total || 0;
    const totalPages = Math.ceil(total / pageLimit);

    return res.status(200).json({
      total,
      totalPages,
      currentPage: pageNumber,
      products, // <-- status should be present in each product object
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const getSingleProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json({ product });
        
    } catch (error) {
        
    }
}




export const bulkUploadProducts = async (req: Request, res: Response) => {
  try {
    const file = req.file;


    

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const parsedData = await parseFileBuffer(file);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return res.status(400).json({ message: 'File is empty or invalid format' });
    }

    // Map and sanitize data
    const validProducts = parsedData.map(p => ({
      name: p.name,
      price: Number(p.price),
      category: p.category,
      stock: Number(p.stock),
      imageUrl: p.imageUrl || '',
      description: p.description,
      status: p.status || 'inactive', // add status with default
    }));

    const inserted = await Product.insertMany(validProducts);

    return res.status(200).json({
      message: 'Bulk upload successful',
      insertedCount: inserted.length,
      data: inserted,
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return res.status(500).json({ message: 'Upload failed', error });
  }
};



export const updateStatus = async (req: Request, res: Response) => {
    const { id} = req.params;
    const product = await Product.findById(id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
   
    if (product.status === 'inactive' && (!product.imageUrl || product.imageUrl === '')) {
        return res.status(400).json({ message: 'Cannot activate product without image' });
    }
    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();
    return res.status(200).json({ message: 'Product status updated', product });
}


export const deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


export const updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const file = req.file;
    let imageUrl = "";
     if (file && file.buffer) {
            imageUrl = await new Promise<string>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "products" },
                    (error, result) => {
                        if (error || !result) {
                            reject(error || new Error("Cloudinary upload failed"));
                        } else {
                            resolve(result.secure_url);
                        }
                    }
                );
                 stream.end(file.buffer);
            });
        }
    try {
        const product = await Product.findByIdAndUpdate(id, { ...req.body, imageUrl }, { new: true });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }

     
}