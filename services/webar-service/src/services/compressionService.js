const fs = require('fs');
const path = require('path');
const obj2gltf = require('obj2gltf');
const { ModelConverter } = require('@polar3d/model-converter');

// We use dynamic imports because glTF-Transform is an ES Module
async function getTransformTools() {
    const core = await import('@gltf-transform/core');
    const extensions = await import('@gltf-transform/extensions');
    const functions = await import('@gltf-transform/functions');
    const draco3d = require('draco3d');

    return {
        NodeIO: core.NodeIO,
        KHRONOS_EXTENSIONS: extensions.KHRONOS_EXTENSIONS,
        functions,
        draco3d
    };
}

exports.compressModel = async (originalFilePath, filename) => {
    try {
        const optimizedDir = path.join(__dirname, '../uploads/optimized');
        if (!fs.existsSync(optimizedDir)) {
            fs.mkdirSync(optimizedDir, { recursive: true });
        }

        // Load ESM modules dynamically
        const { NodeIO, KHRONOS_EXTENSIONS, functions, draco3d } = await getTransformTools();
        const { dedup, weld, resample, prune, draco } = functions;

        const io = new NodeIO()
            .registerExtensions(KHRONOS_EXTENSIONS)
            .registerDependencies({
                'draco3d.decoder': await draco3d.createDecoderModule(),
                'draco3d.encoder': await draco3d.createEncoderModule(),
            });
        
        let finalOriginalPath = originalFilePath;
        let finalFilename = filename;
        const ext = path.extname(originalFilePath).toLowerCase();

        // --- AUTO-CONVERSION LOGIC ---
        if (ext === '.obj') {
            console.log('🔄 Converting OBJ to GLB...');
            const glbBuffer = await obj2gltf(originalFilePath, { binary: true });
            const glbPath = originalFilePath.replace('.obj', '.glb');
            fs.writeFileSync(glbPath, glbBuffer);
            finalOriginalPath = glbPath;
            finalFilename = filename.replace('.obj', '.glb');
        } else if (ext === '.stl') {
            console.log('🔄 Converting STL to GLB...');
            const converter = new ModelConverter();
            const glbBuffer = await converter.convert(originalFilePath, 'glb');
            const glbPath = originalFilePath.replace('.stl', '.glb');
            fs.writeFileSync(glbPath, glbBuffer);
            finalOriginalPath = glbPath;
            finalFilename = filename.replace('.stl', '.glb');
        }

        const optimizedFilePath = path.join(optimizedDir, `opt-${finalFilename}`);

        // 1. Read original document (Now always a GLB)
        const document = await io.read(finalOriginalPath);
        
        // 2. Apply optimization pipeline
        await document.transform(
            dedup(),
            weld(),
            resample(),
            prune(),
            draco({ method: 'edgebreaker', quantizePosition: 14 })
        );

        // 3. Write optimized document
        await io.write(optimizedFilePath, document);

        // 4. Calculate stats
        const originalStats = fs.statSync(originalFilePath);
        const optimizedStats = fs.statSync(optimizedFilePath);
        
        const originalSize = originalStats.size;
        const optimizedSize = optimizedStats.size;
        
        let compressionRatio = 0;
        if (originalSize > 0) {
            compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;
        }

        return {
            optimizedFileUrl: `/uploads/optimized/opt-${finalFilename}`,
            originalSize,
            optimizedSize,
            compressionRatio: parseFloat(compressionRatio.toFixed(2))
        };

    } catch (error) {
        console.error('Error in compression service:', error);
        throw new Error('Failed to compress 3D model: ' + error.message);
    }
};
