

const router = require("express").Router();
import { addProduct, getProducts, getCategories, bulkUploadProducts, updateStatus, deleteProduct, updateProduct, getSingleProduct } from "../controllers/productController";
import { authenticate, checkPermission } from "../middlewares/auth";
import upload from "../middlewares/multer";


router.post("/add",  authenticate, checkPermission('admin'),  upload.single('image'), addProduct);
router.post("/upload", authenticate, checkPermission('admin'),  upload.single('file'), bulkUploadProducts);
router.get("/categories", authenticate, getCategories);
router.get("/", authenticate, getProducts);
router.put("/status/:id" , authenticate , checkPermission('admin'), updateStatus);
router.delete("/delete/:id", authenticate,checkPermission('admin'), deleteProduct);
router.put("/update/:id", authenticate, checkPermission('admin'), upload.single('image'), updateProduct); 
router.get("/:id", authenticate, getSingleProduct);



export default router;