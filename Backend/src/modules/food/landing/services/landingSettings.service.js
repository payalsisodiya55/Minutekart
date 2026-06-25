import { v2 as cloudinary } from 'cloudinary';
import { uploadBufferDetailed } from '../../../../services/cloudinary.service.js';
import { FoodLandingSettings } from '../models/landingSettings.model.js';

export const getLandingSettings = async () => {
    let doc = await FoodLandingSettings.findOne().lean();
    if (!doc) {
        doc = (await FoodLandingSettings.create({})).toObject();
    }
    return doc;
};

export const updateLandingSettings = async (payload) => {
    const doc = await FoodLandingSettings.findOneAndUpdate({}, payload, {
        new: true,
        upsert: true
    }).lean();
    return doc;
};

export const uploadLandingHeaderVideo = async (file) => {
    if (!file?.buffer) {
        throw new Error('Video file is required');
    }

    const existing = await getLandingSettings();
    const uploaded = await uploadBufferDetailed(file.buffer, {
        folder: 'food/landing/header-video',
        resourceType: 'video'
    });

    if (existing?.headerVideoPublicId) {
        await cloudinary.uploader
            .destroy(existing.headerVideoPublicId, { resource_type: 'video' })
            .catch(() => {});
    }

    return updateLandingSettings({
        headerVideoUrl: uploaded?.secure_url || '',
        headerVideoPublicId: uploaded?.public_id || ''
    });
};

export const deleteLandingHeaderVideo = async () => {
    const existing = await getLandingSettings();

    if (existing?.headerVideoPublicId) {
        await cloudinary.uploader
            .destroy(existing.headerVideoPublicId, { resource_type: 'video' })
            .catch(() => {});
    }

    return updateLandingSettings({
        headerVideoUrl: '',
        headerVideoPublicId: ''
    });
};

export const uploadLandingHeaderImages = async (files) => {
    if (!files || files.length === 0) {
        throw new Error('Image files are required');
    }

    const existing = await getLandingSettings();
    const currentImages = existing.headerImages || [];
    const currentPublicIds = existing.headerImagesPublicIds || [];

    const uploadedUrls = [];
    const uploadedPublicIds = [];

    for (const file of files) {
        if (!file.buffer) continue;
        const uploaded = await uploadBufferDetailed(file.buffer, {
            folder: 'food/landing/header-images',
            resourceType: 'image'
        });
        if (uploaded?.secure_url) {
            uploadedUrls.push(uploaded.secure_url);
            uploadedPublicIds.push(uploaded.public_id || '');
        }
    }

    return updateLandingSettings({
        headerImages: [...currentImages, ...uploadedUrls],
        headerImagesPublicIds: [...currentPublicIds, ...uploadedPublicIds]
    });
};

export const deleteLandingHeaderImage = async (imageIndex) => {
    const existing = await getLandingSettings();
    const currentImages = [...(existing.headerImages || [])];
    const currentPublicIds = [...(existing.headerImagesPublicIds || [])];

    const idx = parseInt(imageIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= currentImages.length) {
        throw new Error('Invalid image index');
    }

    const publicId = currentPublicIds[idx];
    if (publicId) {
        await cloudinary.uploader
            .destroy(publicId, { resource_type: 'image' })
            .catch(() => {});
    }

    currentImages.splice(idx, 1);
    currentPublicIds.splice(idx, 1);

    return updateLandingSettings({
        headerImages: currentImages,
        headerImagesPublicIds: currentPublicIds
    });
};


