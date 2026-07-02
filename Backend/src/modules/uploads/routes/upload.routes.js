import express from 'express';
import { upload } from '../../../middleware/upload.js';
import { uploadBufferDetailed } from '../../../services/cloudinary.service.js';

const router = express.Router();

// POST /v1/uploads/image
router.post('/image', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'No file provided'
            });
        }

        const folder = typeof req.body?.folder === 'string' && req.body.folder.trim()
            ? req.body.folder.trim()
            : 'uploads';

        // Auto-detect resource type based on file mimetype
        const mimetype = req.file.mimetype || '';
        const resourceType = mimetype.startsWith('video/') ? 'video' : 'image';

        const uploadResult = await uploadBufferDetailed(req.file.buffer, { folder, resourceType });
        const url = uploadResult.secure_url || uploadResult.url;

        return res.status(200).json({
            success: true,
            message: `${resourceType === 'video' ? 'Video' : 'Image'} uploaded successfully`,
            data: {
                url,
                publicId: uploadResult.public_id || null,
                resourceType
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;

