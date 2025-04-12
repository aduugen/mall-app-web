import request from '@/utils/requestUtil'

export function searchProductList(params) {
	return request({
		method: 'GET',
		url: '/product/search',
		params: params
	})
}

export function fetchCategoryTreeList() {
	return request({
		method: 'GET',
		url: '/product/categoryTreeList'
	})
}

export function fetchProductDetail(id) {
	return request({
		method: 'GET',
		url: '/product/detail/'+id
	})
}

/**
 * 检查商品状态是否可用（上架且未删除）
 */
export function checkProductStatus(id) {
	return request({
		method: 'GET',
		url: `/product/checkStatus/${id}`
	});
}

