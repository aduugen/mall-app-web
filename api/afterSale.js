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
 * @param {Array} data.orderItemIds - 订单项ID列表
 * @param {string} data.reason - 退货原因
 * @param {Array} data.pics - 图片URL列表
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