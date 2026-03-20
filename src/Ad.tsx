import { useEffect, useRef } from 'react';

export function GoogleAd() {
    const adRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            if ((window as any).adsbygoogle && adRef.current) {
                (window as any).adsbygoogle.push({});
            }
        } catch (e) {
            console.error('Ad failed to load', e);
        }
    }, []);

    return (
        <div className="flex justify-center my-6">
            <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', maxWidth: 728, height: 90 }}
                data-ad-client="ca-pub-4931674100298815"
                data-ad-slot="6485343527"
                data-ad-format="auto"
                data-full-width-responsive="true"
                ref={adRef}
            ></ins>
        </div>
    );
}