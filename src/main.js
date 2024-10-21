import "./css/default.scss"
import "./css/index.scss"
import "./css/mobile.scss"

import lozad from 'lozad'
function initLazyLoad() {
    const observer = lozad('.lozad', {
        rootMargin: '10px 0px',
        threshold: 0.1,
        loaded: function(el) {
            el.querySelectorAll('source').forEach(source => {
                const dataSrcset = source.getAttribute('data-srcset');
                if (dataSrcset) {
                    source.setAttribute('srcset', dataSrcset);
                }
            });

            const img = el.querySelector('img');
            if (img) {
                const dataSrc = img.getAttribute('data-src');
                if (dataSrc) {
                    img.setAttribute('src', dataSrc);
                }
            }
            el.classList.add('loaded');
        }
    });
    observer.observe();
}

document.addEventListener('DOMContentLoaded', ()=>{
    initLazyLoad();
})