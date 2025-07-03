import { Request, Response } from "express";

import {
  decodePassword,
  encodePassword,
  generateToken,
  isValidEmail,
  sendEmail,
  sendPasswordResetEmail,
  sendInvitationEmail,
} from "../utils/userUtils";
import axios from "axios";
import jwt from "jsonwebtoken";
import verificationsucess from "../templates/verificationsucess";
import alreadyverfied from "../templates/alreadyverfied";
import linkexpiration from "../templates/linkexpiration";
import tokennotfound from "../templates/tokennotfound";
import usernotfound from "../templates/usernotfound";
import User from "../models/userModel";
import cloudinary from "../configs/cloudinary";
import { paginateAndSearch } from "../utils/paginateAndSearch";
import Product from "../models/productModel";


interface UserData {
  email: string;
  name: string;
  picture?: string;
  verified: boolean;
}

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  purpose?: string;
  [key: string]: any;
}

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists", success: false });
    }
    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ message: "Invalid email format", success: false });
    }

    const hashedPassword = await encodePassword(password);
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();
    const token = generateToken(user, '10m', { purpose: "email-verification" });

    res.status(201).json({
      message: "Please check you mail for verification",
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
    const link = `${req.protocol}://${req.get("host")}/api/user/verify-email?token=${token}`;

    sendEmail(user.email, link);
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ message: "Invalid email format", success: false });
  }
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not registerd", success: false });
    }

    if (user.password) {
      const isPasswordValid = await decodePassword(password, user.password);
      if (!user.verified) {
        const token = generateToken(user, '10m', { purpose: "email-verification" });
        const link = `${req.protocol}://${req.get("host")}/api/user/verify-email?token=${token}`;
        await sendEmail(user.email, link);
        return res.status(400).json({ message: "User not verified. Verification link sent to your email.", success: false });
      }
      if (!isPasswordValid) {
        return res
          .status(403)
          .json({ message: "Invalid credentials", success: false });
      }
    } else {
      return res.status(403).json({ message: "Please continue with google login" });
    }

    
    const token = generateToken(user , '1d', { role: user.role || "user" });
    return res.status(200).json({
      message: "Login successful",
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture || "",
        role : user.role || "user",
      },
      token,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const redirectToGoogle = (req: Request, res: Response) => {
  const redirectUri =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

  res.redirect(redirectUri);
};

export const googleAuthCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send("Missing authorization code.");
  }

  try {
    const { data: tokenResponse } = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const idToken = tokenResponse.id_token;
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64").toString("utf-8")
    ) as TokenPayload;

    const userData: UserData = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified: true
    };

    const user = await User.findOneAndUpdate(
      { email: payload.email },
      userData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    res.redirect(
      `${process.env.FRONTEND_URL
      }/success?token=${jwtToken}&email=${encodeURIComponent(
        user.email
      )}&name=${encodeURIComponent(user.name)}&picture=${encodeURIComponent(
       JSON.stringify( user.picture) || ''
      )}&id=${encodeURIComponent(user.id)}&role=${encodeURIComponent(user.role || 'user')}`
    );
  } catch (err) {
    console.error("OAuth Error:", err instanceof Error ? err.message : 'Unknown error');
    res.status(500).send("Authentication failed");
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query as { token: string };

  if (!token) {
    return res.status(400).send(tokennotfound);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send(usernotfound);
    }
    
    if (decoded.purpose === "reset-password") {
      const date = Date.now();
      user.slug = date.toString();
      await user.save();
      return res.redirect(`${process.env.FRONTEND_URL}/reset-password/${date}`);
    }

    if (user.verified) {
      return res.status(400).send(alreadyverfied);
    }

    user.verified = true;
    await user.save();

    if (decoded.purpose === "email-verification") {
      return res.send(verificationsucess);
    }

  } catch (error) {
    console.error('Email verification failed:', error instanceof Error ? error.message : 'Unknown error');

    let errorMessage = 'Invalid or malformed verification token.';
    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = 'Verification link has expired. Please request a new one.';
    }

    return res.status(400).send(linkexpiration(errorMessage));
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found, please register",
        success: false,
      });
    }

    const token = generateToken(user, "6m", { purpose: "reset-password" });
    await user.save();

    const link = `${req.protocol}://${req.get("host")}/api/user/verify-email?token=${token}`;

    res.status(200).json({
      message: "Reset link generated",
      token,
      success: true,
    });
    await sendPasswordResetEmail(user.email, link);
  } catch (error) {
    console.error("Reset Password Error:", error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { slug, newPassword } = req.body;

  if (!slug || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const user = await User.findOne({ slug });

    if (!user) {
      return res.status(404).json({ message: "Invalid or expired reset link." });
    }

    const expiryLimit = 6 * 60 * 1000; // 6 minutes
    const isExpired = Date.now() - Number(user.slug) > expiryLimit;

    if (isExpired) {
      return res.status(410).json({ message: "Reset link has expired. Please request a new one." });
    }

    const hashedPassword = await encodePassword(newPassword);
    user.password = hashedPassword;
      user.set('slug', undefined, { strict: false });

    await user.save();

    return res.status(200).json({ message: "Password has been reset successfully." });

  } catch (error) {
    console.error("❌ Password reset error:", error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({ message: "Internal server error." });
  }
};


interface AuthenticatedRequest extends Request {
  userId: string;
}

 export const userProfile = async(req:AuthenticatedRequest, res:Response)=>{
   const id = req.userId;
   try {
    const user = await User.findById(id);
   res.status(200).json(user);
    } catch (error) {
    console.log(error);  
   }
}


 export const updateUser = async(req:AuthenticatedRequest, res:Response)=>{
  const id = req.userId;
  const {name, email } = req.body;
  const file = req.file;
  
  try {
    const user = await User.findById(id);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }
    let picture ="";
     if (file && file.buffer) {
                // Upload file buffer to Cloudinary using upload_stream
                picture = await new Promise<string>((resolve, reject) => {
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
   if (picture) user.picture = picture;
   if(name) user.name = name;
   if(email) user.email = email;
    
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
  }
}

export const getUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const sortField = (req.query.sortField as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // आप चाहें तो filter भी req.query से ले सकते हैं
    const filter: Record<string, any> = {};
    // उदाहरण के लिए, role पर filter
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const result = await paginateAndSearch(User, {
      page,
      limit,
      search,
      searchFields: ["name", "email"],
      filter,
      sort: { [sortField]: sortOrder },
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    // Products से जुड़ी सारी गिनती एक aggregate कॉल में
    const productStats = await Product.aggregate([
      {
        $facet: {
          products: [{ $count: "count" }],
          outOfStock: [{ $match: { stock: { $lte: 0 } } }, { $count: "count" }],
          activeProducts: [{ $match: { status: "active" } }, { $count: "count" }],
          inactiveProducts: [{ $match: { status: "inactive" } }, { $count: "count" }],
          categories: [ { $group: { _id: "$category" } }, { $count: "count" } ]
        }
      }
    ]);

    const statsObj = productStats[0];
    const products = statsObj.products[0]?.count || 0;
    const outOfStock = statsObj.outOfStock[0]?.count || 0;
    const activeProducts = statsObj.activeProducts[0]?.count || 0;
    const inactiveProducts = statsObj.inactiveProducts[0]?.count || 0;
    const categories = statsObj.categories[0]?.count || 0;

    const users = await User.countDocuments();

    res.status(200).json({
      success: true,
      stats: {
        products,
        categories,
        users,
        outOfStock,
        activeProducts,
        inactiveProducts
      }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const userInvitation = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }
    // Generate 8-character temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await encodePassword(tempPassword);
    // Create user
    user = new User({ name, email, password: hashedPassword, verified: false , role :"admin"});
    await user.save();
    // Send invitation email (sendInvitationEmail का उपयोग)
    await sendInvitationEmail(email, name, tempPassword);
    return res.status(201).json({ success: true, message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error inviting user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};





