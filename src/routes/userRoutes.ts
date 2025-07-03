import { Router } from 'express';
const router = Router();
import { registerUser, loginUser, redirectToGoogle, googleAuthCallback, verifyEmail, forgotPassword, resetPassword, userProfile, updateUser, getUsers, getStats, userInvitation } from '../controllers/userController';
import { authenticate , checkPermission} from '../middlewares/auth';
import { updateProduct } from '../controllers/productController';
import upload from '../middlewares/multer';

// Helper to wrap async route handlers and forward errors to Express
const wrapAsync = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/register', wrapAsync(registerUser));
router.post('/login', wrapAsync(loginUser));
router.get('/google', wrapAsync(redirectToGoogle));
router.get('/google/callback', wrapAsync(googleAuthCallback));
router.get('/verify-email', wrapAsync(verifyEmail));
router.post('/forgot-password', wrapAsync(forgotPassword));
router.post('/reset-password', wrapAsync(resetPassword));
router.get('/profile' , wrapAsync(authenticate), wrapAsync(userProfile));
router.put('/profile' , wrapAsync(authenticate),upload.single('picture'), wrapAsync(updateUser));
router.get('/',wrapAsync(authenticate),wrapAsync(checkPermission('admin')), wrapAsync(getUsers));
router.get('/stats', wrapAsync(authenticate), wrapAsync(checkPermission('admin')) , wrapAsync(getStats));
router.post('/invite',wrapAsync(authenticate), wrapAsync(checkPermission('admin')), wrapAsync(userInvitation));

export default router;