const emit = require('./../emit');
const magento = require('./../magento');

/**
 * Welcome Handler
 */
const welcome = function () {
    emit.call(this, 'ask', this.t('WELCOME'), this.t('REPROMPT'));
};

/**
 * Quit Handler
 */
const quit = function () {
    emit.call(this, 'tell', this.t('QUIT'));
};

/**
 * Help Handler
 */
const help = function () {
    emit.call(this, 'ask', this.t('HELP'));
};

/**
 * Add a product to cart by name handler
 */
const addToCartByName = function () {
    let that = this;
    let quantity = getQuantityFromRequest(this.event.request);
    getSku(
        this.event.request,
        function (sku) {
            if (!sku) {
                let userUtterance = getUserProductNameUtterance(that.event.request);
                let responseText = that.t('PRODUCT_NOT_FOUND', userUtterance) + ' ' + that.t('RETRY');
                emit.call(that,
                    'ask',
                    responseText
                );
            } else {
                magento.addToCart(sku, quantity, function (data) {
                    emit.call(that,
                        'ask',
                        that.t('ADDTOCART', data.name, data.qty)
                    );
                });
            }
        }
    );
};

/**
 * Determine SKU for the words uttered by the customers
 *
 * 1) try to get the SKU through the products in the language model and the data in the request object
 * 2) then try to find a suitable product through product search
 *
 * @param {Object} request
 * @param {Function} callback
 */
const getSku = function (request, callback) {
    let sku = getSkuFromRequest(request);
    if (!sku) {
        let userUtterance = getUserProductNameUtterance(request);
        if (userUtterance) {
            magento.search(userUtterance, function (result) {
                if (result['total_count'] > 0) {
                    let searchResult = result['items'].shift();
                    sku = searchResult.sku;
                    callback(sku);
                } else {
                    callback(null);
                }
            });
            return;
        }
    }
    callback(sku);
};

/**
 * Extract what the user said
 *
 * @param {Object} request
 * @returns {String}
 */
const getUserProductNameUtterance = function (request) {
    if (request.intent.slots.SEARCHTERM && request.intent.slots.SEARCHTERM.value) {
        return request.intent.slots.SEARCHTERM.value
    }
    return '';
};

/**
 * Get SKU from request for 'add to cart by name'
 *
 * @param {Object} request
 * @returns {String}
 */
const getSkuFromRequest = function (request) {
    let sku = null;
    try {
        sku = request.intent.slots.SEARCHTERM.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    } catch (e) {
    }

    return sku;
};

/**
 * Get quantity from an intent request
 *
 * @param {Object} request
 * @returns {number}
 */
const getQuantityFromRequest = function (request) {
    let qty;
    try {
        qty = request.intent.slots.QUANTITY.value;
    } catch (e) {
    }

    if (!qty) {
        qty = 1;
    }

    return qty;
};

module.exports = {
    'Unhandled': welcome,
    'LaunchRequest': welcome,
    'AMAZON.StartOverIntent': welcome,
    'StartIntent': welcome,
    'AddToCartByNameIntent': addToCartByName,
    'AMAZON.StopIntent': quit,
    'AMAZON.CancelIntent': quit,
    'AMAZON.HelpIntent': help
};
