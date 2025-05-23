import request from '@/utils/requestUtil'

export function generateConfirmOrder(data) {
	return request({
		method: 'POST',
		url: '/order/generateConfirmOrder',
		data: data
	})
}

export function generateOrder(data) {
	return request({
		method: 'POST',
		url: '/order/generateOrder',
		data: data
	})
}

export function fetchOrderList(params) {
	return request({
		method: 'GET',
		url: '/order/list',
		params: params
	})
}

export function payOrderSuccess(data) {
	return request({
		method: 'POST',
		url: '/order/paySuccess',
		header: {
			'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
		},
		params: {
			orderId: data.orderId,
			payType: data.payType
		}
	})
}

export function fetchOrderDetail(orderId) {
	return request({
		method: 'GET',
		url: `/order/detail/${orderId}`
	})
}

export function cancelUserOrder(data) {
	return request({
		method: 'POST',
		url: '/order/cancelUserOrder',
		header: {
			'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
		},
		params: {
			orderId: data.orderId
		}
	})
}

export function confirmReceiveOrder(data) {
	return request({
		method: 'POST',
		url: '/order/confirmReceiveOrder',
		header: {
			'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
		},
		params: {
			orderId: data.orderId
		}
	})
}

export function deleteUserOrder(data) {
	return request({
		method: 'POST',
		url: '/order/deleteOrder',
		header: {
			'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
		},
		params: {
			orderId: data.orderId
		}
	})
}

export function fetchAliapyStatus(params) {
	return request({
		method: 'GET',
		url: '/alipay/query',
		params: params
	})
}

/**
 * 创建商品评价
 * @param {Object} data
 * @param {number} data.orderId - 订单ID
 * @param {number} data.productId - 商品ID
 * @param {number} data.rating - 评分(1-5)
 * @param {string} data.comment - 评价内容
 * @param {Array} data.pics - 评价图片URL数组
 */
export function createProductComment(data) {
	return request({
		url: '/order/comment/create',
		method: 'post',
		data: data
	});
}

/**
 * 批量创建商品评价
 * @param {Object} data
 * @param {number} data.orderId - 订单ID
 * @param {Array} data.commentItems - 评价项数组
 * @param {number} data.commentItems[].productId - 商品ID
 * @param {number} data.commentItems[].rating - 评分(1-5)
 * @param {string} data.commentItems[].comment - 评价内容
 * @param {Array} data.commentItems[].pics - 评价图片URL数组
 */
export function createBatchProductComment(data) {
	return request({
		url: '/order/comment/batch/create',
		method: 'post',
		data: data
	});
}

/**
 * 获取订单中待评价商品列表
 * @param {number} orderId - 订单ID
 */
export function getOrderProductsForComment(orderId) {
	return request({
		url: `/order/comment/products/${orderId}`,
		method: 'get'
	});
}

/**
 * 申请发票
 * @param {Object} data
 */
export function applyInvoice(data) {
	return request({
		url: '/order/invoice/apply',
		method: 'post',
		data: data
	});
}

export function fetchInvoiceList(data) {
	return request({
		url: '/order/invoice/list',
		method: 'get',
		params: data
	});
}

/**
 * 获取发票详情
 * @param {number} id - 发票ID
 */
export function fetchInvoiceDetail(id) {
	return request({
		url: `/order/invoice/detail/${id}`,
		method: 'get'
	});
}

/**
 * 检查订单是否已申请过发票
 * @param {number} orderId - 订单ID
 */
export function checkOrderInvoice(orderId) {
	return request({
		url: `/order/invoice/check/${orderId}`,
		method: 'get'
	});
}

/**
 * 调试接口 - 获取订单商品项详细信息
 * @param {number} orderId - 订单ID
 */
export function getOrderItemsDebug(orderId) {
	return request({
		url: `/order/debug/orderItems/${orderId}`,
		method: 'get'
	});
}

/**
 * 获取订单详情
 * @param {number} orderId - 订单ID
 */
export function getOrderDetail(orderId) {
	return request({
		url: `/order/detail/${orderId}`,
		method: 'get'
	});
}
