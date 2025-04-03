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
 * @param {Object} params 包含 id 和 quantity 字段
 * @throws {Error} 如果参数无效
 */
export async function updateCartItem(params) {
    if (!params || typeof params !== 'object' || !params.id || typeof params.quantity === 'undefined') {
        throw new Error('Invalid params: Expected an object with "id" and "quantity" fields');
    }
    try {
        const response = await request({
            url: '/cart/update/quantity',
            method: 'POST',
            data: params,
            headers: {
                'Content-Type': 'application/json;charset=UTF-8'
            },
            timeout: 10000
        });
        return response;
    } catch (error) {
        console.error('Failed to update cart item:', error);
        throw error; // 或者根据需要处理错误
    }
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