import { standardErrors } from '../error';
const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 540;
// Window Management
export function openPopup(url) {
    const left = (window.innerWidth - POPUP_WIDTH) / 2 + window.screenX;
    const top = (window.innerHeight - POPUP_HEIGHT) / 2 + window.screenY;
    const popup = window.open(url, 'Smart Wallet', `width=${POPUP_WIDTH}, height=${POPUP_HEIGHT}, left=${left}, top=${top}`);
    popup === null || popup === void 0 ? void 0 : popup.focus();
    if (!popup) {
        throw standardErrors.rpc.internal('Pop up window failed to open');
    }
    return popup;
}
export function closePopup(popup) {
    if (popup && !popup.closed) {
        popup.close();
    }
}
