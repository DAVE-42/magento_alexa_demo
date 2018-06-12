const request = require('request');
const querystring = require('querystring');
const settings = require('./settings');

/**
 * @type {Object} contains the transactions options for API calls to Magento
 */
let options = {
    token: null,
    cartId: null
};

/**
 * Authentication at the Magento server. This will acquire a security token that will be
 * used for further communication. It is able to request tokens for admin and customers
 *
 * @param {String} username admin or user name
 * @param {String} password admin or user password
 * @param {String} type can be "admin" or "customer"
 * @param {Function} callback will be called when transaction is successful
 */
function doAuthentication(username, password, type, callback) {
    let body = JSON.stringify({
            'username': username,
            'password': password
        }
    );

    request.post(
        {
            headers: {
                'content-type': 'application/json'
            },
            url: 'http://' + settings.host + '/rest/default/V1/integration/' + type + '/token',
            body: body
        },
        function (error, response, body) {

            let token;
            if (error) {
                token = error;
            } else {
                token = sanitizeResponse(body);
            }
            options.token = token;
            callback();
        }
    );
}
/**
 * Get security tokens for customers
 *
 * @param {Function} callback
 */
function authenticate(callback) {
    doAuthentication(settings.username, settings.password, 'customer', callback);
}

/**
 * Get security token for admin
 *
 * @param {Function} callback
 */
function authenticateAdmin(callback) {
    doAuthentication(settings.admin_user, settings.admin_password, 'admin', callback);
}

/**
 * Most rudimentary logging wrapper ever. If you do not want to have any logs on command line.
 * just comment out the console.log - call
 *
 * @param {String} msg
 */
function log(msg) {
    console.log(msg);
}

/**
 * Get the user's cart id. This is necessary to add elements to a cart.
 *
 * @param callback
 */
function getUserCartId(callback) {
    request.post({
        headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer ' + options.token
        },
        url: 'http://' + settings.host + '/rest/V1/carts/mine',
    }, function (error, response, body) {
        options.cartId = sanitizeResponse(body);;
        callback();
    });
}

/**
 * Add a shopping cart item via SKU
 *
 * @param {String} sku
 * @param {Number} qty
 * @param {Function} callback
 */
function addToCart(sku, qty, callback) {
    prepare(
        function () {
            let body = {
                "cart_item": {
                    "quote_id": options.cartId,
                    "sku": sku,
                    "qty": qty
                }
            };

            request.post({
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + options.token
                },
                url: 'http://' + settings.host + '/rest/V1/carts/mine/items',
                body: JSON.stringify(body)
            }, function (error, response, body) {
                let result = JSON.parse(body);
                log(result);
                callback(result);
            });
        }
    );
}

/**
 * Search for products by name using Magento's product search
 *
 * First, a search is performed to get the product ids matching the specified name.
 * Then, the product endpoint is used to get the skus for the matched ids.
 *
 * @param {String} name
 * @param {Function} callback
 */
function search(name, callback) {
    log('Retrieving admin token ...');
    prepareAdmin(
        function () {
            log('Admin token acquired ...');
            let url = 'http://' + settings.host + '/rest/V1/search?' +
                'searchCriteria[requestName]=quick_search_container&' +
                'searchCriteria[filter_groups][0][filters][0][field]=search_term&' +
                'searchCriteria[filter_groups][0][filters][0][value]=%25' + name + '%25&' +
                'searchCriteria[current_page]=1&' +
                'searchCriteria[page_size]=1'
            ;

            log('Sending get request to Magento for product search ...');
            request.get({
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Bearer ' + options.token
                },
                url: url
            }, function (error, response, body) {
                let results = JSON.parse(body);
                if (results.items && results.items.length > 0) {
                    let productId = results.items[0].id;
                    let url = 'http://' + settings.host + '/rest/V1/products?' +
                            'searchCriteria[filter_groups][0][filters][0][field]=entity_id&' +
                            'searchCriteria[filter_groups][0][filters][0][value]=%25' + productId + '%25&' +
                            'searchCriteria[filter_groups][0][filters][0][condition_type]=like&' +
                            'searchCriteria[current_page]=1&searchCriteria[page_size]=1'
                        ;

                    request.get({
                            headers: {
                                'content-type': 'application/json',
                                'Authorization': 'Bearer ' + options.token
                            },
                            url: url
                        }, function (error, response, body) {
                            log('Received response ...');
                            let result = JSON.parse(body);
                            log(result);
                            callback(result);
                        }
                    );
                }
            });
        }
    );
}

/**
 * Remove everything from the response that is not needed.
 * Magento wraps the answers in quotes which are not part of the actual answer. If you request a token and leave
 * the quotes in, the token will not validate in a subsequent call.
 *
 * @param {String} response
 */
function sanitizeResponse(response) {
    return response.replace(/"/g, '');
}

/**
 * Prepare a call to Magento for customers (get security token and cart id)
 *
 * @param callback
 */
function prepare(callback) {
    authenticate(
        function () {
            getUserCartId(callback);
        }
    );
}

/**
 * Prepare a call to
 *
 * @param callback
 */
function prepareAdmin(callback) {
    authenticateAdmin(callback)
}

// interface
module.exports = {
    addToCart: addToCart,
    search: search
};