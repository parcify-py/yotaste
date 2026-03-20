import { useEffect } from 'react';

export function GoogleAd() {
    useEffect(() => {
        try {
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            (window as any).adsbygoogle.push({});
        } catch (e) {
            console.error('Ad failed to load', e);
        }
    }, []);

    return (
        <div className="my-6 overflow-hidden min-h-[90px] w-full flex justify-center">
            <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: '100%', minWidth: '300px', maxWidth: '728px', minHeight: '90px' }}
                data-ad-client="ca-pub-4931674100298815"
                data-ad-slot="6485343527"
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        </div>
    );
}