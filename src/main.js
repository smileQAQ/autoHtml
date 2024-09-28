import "./css/default.scss"
import "./css/index.scss"
import "./css/mobile.scss"

import lozad from 'lozad'
function initLazyLoad() {
    const observer = lozad('.lozad', {
        rootMargin: '10px 0px',
        threshold: 0.1,
        loaded: function(el) {
            el.classList.add('loaded');
        }
    });

    observer.observe();
}

document.addEventListener('DOMContentLoaded', ()=>{
    initLazyLoad();
})