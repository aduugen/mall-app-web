import request from '@/utils/requestUtil'

/**
 * 获取售后列表
 * @param {Object} params
 * @param {number} params.status - 售后状态
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页数量
 */
export function fetchAfterSaleList(params) {
	return request({
		method: 'GET',
		url: '/member/afterSale/list',
		params: params
	})
}

/**
 * 创建售后申请
 * @param {Object} data
 * @param {number} data.orderId - 订单ID
 * @param {Array} data.items - 售后商品详情列表
 * @param {number} data.items[].orderItemId - 订单项ID
 * @param {number} data.items[].returnQuantity - 退货数量
 * @param {string} data.items[].productId - 商品ID
 * @param {string} data.items[].productSkuId - 商品规格ID
 * @param {string} data.items[].productName - 商品名称
 * @param {string} data.items[].productPic - 商品图片
 * @param {string} data.items[].productAttr - 商品属性
 * @param {number} data.items[].productPrice - 商品单价
 * @param {string} data.items[].productSkuCode - 商品规格编码
 * @param {string} data.items[].reason - 退货原因
 * @param {string} data.items[].pics - 退货凭证图片，多个用逗号分隔
 */
export function createAfterSale(data) {
	return request({
		method: 'POST',
		url: '/member/afterSale/create',
		data: data
	})
}

/**
 * 获取售后详情
 * @param {Object} params
 * @param {number} params.id - 售后ID
 */
export function fetchAfterSaleDetail(params) {
	return request({
		method: 'GET',
		url: '/member/afterSale/detail',
		params: params
	})
}

/**
 * 取消售后申请
 * @param {Object} params
 * @param {number} params.id - 售后ID
 */
export function cancelAfterSale(params) {
	return request({
		method: 'POST',
		url: '/member/afterSale/cancel',
		params: params
	})
} 