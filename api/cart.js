import request from '@/utils/requestUtil'

export function addCartItem(data) {
	return request({
		method: 'POST',
		url: '/cart/add',
		header: {
			'Content-Type': 'application/json;charset=UTF-8'
		},
		data: data
	})
}

export function fetchCartList() {
	return request({
		method: 'GET',
		url: '/cart/list'
	})
}

/**
 * 删除指定购物车项
 * @param {Object} id
 */
export function removeCartItem(id) {
	return request({
		url: '/cart/delete',
		method: 'POST',
		data: [id],
		header: {
			'Content-Type': 'application/json;charset=UTF-8'
		},
		timeout: 10000
	})
}

/**
 * 更新购物车商品数量
 * @param {Object} params 包含id和quantity字段
 */
export function updateCartItem(params) {
	return request({
		url: '/cart/update/quantity',
		method: 'POST',
		params: params,
		header: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		timeout: 10000
	})
}

/**
 * 清空购物车
 */
export function clearCart() {
	return request({
		url: '/cart/clear',
		method: 'POST',
		header: {
			'Content-Type': 'application/json;charset=UTF-8'
		},
		timeout: 10000
	})
}