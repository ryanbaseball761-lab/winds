/* Trade Winds toolbar panel: shows the panel page served by the Trade Winds app on this PC. */
class IngamePanelTradeWinds extends TemplateElement {
    constructor() { super(...arguments); this.ingameUi = null; this.frame = null; }
    connectedCallback() {
        super.connectedCallback();
        var self = this;
        this.ingameUi = this.querySelector('ingame-ui');
        this.frame = document.getElementById('TWFrame');
        if (this.ingameUi) {
            this.ingameUi.addEventListener('panelActive', function () { if (self.frame) self.frame.src = 'http://localhost:4747/panel?t=' + Date.now(); });
            this.ingameUi.addEventListener('panelInactive', function () { if (self.frame) self.frame.src = ''; });
        }
    }
}
window.customElements.define('ingamepanel-tradewinds', IngamePanelTradeWinds);
checkAutoload();
