const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.saveModelMetadata = async (data) => {
    return await prisma.arModel.create({
        data: {
            vendor_id: data.vendor_id,
            shop_id: data.shop_id,
            product_id: data.product_id,
            model_name: data.model_name,
            file_url: data.file_url,
            original_size: data.original_size,
            optimized_size: data.optimized_size,
            optimized_file_url: data.optimized_file_url,
            compression_ratio: data.compression_ratio,
            file_format: data.file_format
        }
    });
};

exports.getModelByProductId = async (productId) => {
    return await prisma.arModel.findFirst({
        where: { product_id: parseInt(productId) },
        orderBy: { uploaded_at: 'desc' }
    });
};

exports.trackAnalytics = async (productId, type) => {
    const model = await this.getModelByProductId(productId);
    if (!model) throw new Error("Model not found for product");

    return await prisma.arModel.update({
        where: { id: model.id },
        data: {
            [type === 'ar' ? 'views_ar' : 'views_3d']: { increment: 1 }
        }
    });
};

exports.getAnalytics = async () => {
    const analytics = await prisma.arModel.aggregate({
        _sum: {
            views_ar: true,
            views_3d: true
        }
    });

    const topModels = await prisma.arModel.findMany({
        orderBy: { views_ar: 'desc' },
        take: 5
    });

    return {
        total_ar_opens: analytics._sum.views_ar || 0,
        total_3d_views: analytics._sum.views_3d || 0,
        top_models: topModels
    };
};
