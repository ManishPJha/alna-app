'use client';

import AppImage from '@/shared/components/ui/image';
import { PhotoProvider, PhotoView } from 'react-photo-view';

const PhotoViewer = ({ src, alt }: { src: string; alt?: string }) => {
    return (
        <PhotoProvider>
            <PhotoView src={src}>
                <AppImage
                    src={src}
                    alt={alt || ''}
                    width={100}
                    height={100}
                    className="cursor-zoom-in w-full h-full object-cover 
                               transform transition-all duration-300 ease-in-out
                               hover:scale-110 hover:opacity-90"
                />
            </PhotoView>
        </PhotoProvider>
    );
};

export default PhotoViewer;
