import request from '@/utils/requestUtil'
import { API_BASE_URL } from '@/utils/appConfig.js'

/**
 * 获取售后列表
 * @param {Object} params
 * @param {number} params.status - 售后状态
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {number} [params.orderId] - 订单ID，可选，用于筛选特定订单的售后记录
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
 * @param {string} data.items[].returnReason - 退货原因
 * @param {string} data.items[].proofPics - 退货凭证图片，多个用逗号分隔
 */
export function createAfterSale(data) {
	try {
		console.log('调用createAfterSale API，原始数据:', JSON.stringify(data));
		
		// 构造安全的请求数据
		const safeData = {
			orderId: Number(data.orderId) || 0,
			items: []
		};
		
		// 处理items数组
		if (data.items && Array.isArray(data.items)) {
			safeData.items = data.items.map(item => {
				// 处理旧版API可能还在使用reason和pics的情况
				const returnReason = item.returnReason || item.reason || '商品退货原因';
				const proofPics = item.proofPics || item.pics || '';
				
				console.log(`商品项 ${item.productName} 的退货原因:`, returnReason);
				
				return {
					orderItemId: Number(item.orderItemId || 0),
					returnQuantity: Number(item.returnQuantity || 1),
					productId: Number(item.productId || 0),
					productSkuId: Number(item.productSkuId || 0),
					productName: String(item.productName || ''),
					productPic: String(item.productPic || ''),
					productAttr: String(item.productAttr || ''),
					productPrice: Number(item.productPrice || 0),
					productSkuCode: String(item.productSkuCode || ''),
					returnReason: String(returnReason),
					proofPics: String(proofPics)
				}
			});
		}
		
		// 最终请求数据检查和打印
		console.log('最终请求数据:', JSON.stringify(safeData));
		
		return new Promise((resolve, reject) => {
			// 获取token
			const token = uni.getStorageSync('token');
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				});
				reject({message: '未登录'});
				return;
			}
			
			// 设置请求URL
			const apiUrl = API_BASE_URL + '/member/afterSale/create';
			
			// 发送请求
			uni.request({
				url: apiUrl,
				method: 'POST',
				data: safeData,
				header: {
					'Content-Type': 'application/json',
					'Authorization': token
				},
				success: (res) => {
					console.log('售后申请响应:', res);
					if (res.statusCode === 200) {
						if (res.data && res.data.code === 200) {
							console.log('售后申请成功');
							resolve(res.data);
						} else {
							console.error('服务器返回错误:', res.data);
							reject({
								message: (res.data && res.data.message) || '服务器处理失败',
								data: res.data
							});
						}
					} else {
						console.error('请求状态码错误:', res.statusCode);
						reject({
							statusCode: res.statusCode,
							message: '请求失败，状态码：' + res.statusCode,
							data: res.data
						});
					}
				},
				fail: (err) => {
					console.error('网络请求失败:', err);
					reject({
						message: '网络请求失败',
						error: err
					});
				}
			});
		});
	} catch (e) {
		console.error('createAfterSale处理异常:', e);
		return Promise.reject({
			message: '系统异常',
			error: e
		});
	}
}

/**
 * 获取售后详情
 * @param {Object} params
 * @param {number} params.id - 售后ID
 */
export function fetchAfterSaleDetail(params) {
	console.log('调用fetchAfterSaleDetail API，参数:', JSON.stringify(params));
	
	return new Promise((resolve, reject) => {
		// 获取token
		const token = uni.getStorageSync('token');
		if (!token) {
			console.error('获取售后详情失败: 未登录');
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			reject({message: '未登录'});
			return;
		}
		
		// 设置请求URL
		const apiUrl = API_BASE_URL + '/member/afterSale/detail';
		console.log('请求URL:', apiUrl);
		
		// 发送请求
		uni.request({
			url: apiUrl,
			method: 'GET',
			data: params,
			header: {
				'Authorization': token
			},
			success: (res) => {
				console.log('售后详情响应:', JSON.stringify(res));
				if (res.statusCode === 200) {
					if (res.data && res.data.code === 200) {
						console.log('获取售后详情成功');
						resolve(res.data);
					} else {
						console.error('服务器返回错误:', res.data);
						reject({
							message: (res.data && res.data.message) || '服务器处理失败',
							data: res.data
						});
					}
				} else {
					console.error('请求状态码错误:', res.statusCode);
					reject({
						statusCode: res.statusCode,
						message: '请求失败，状态码：' + res.statusCode,
						data: res.data
					});
				}
			},
			fail: (err) => {
				console.error('网络请求失败:', err);
				reject({
					message: '网络请求失败',
					error: err
				});
			}
		});
	});
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

/**
 * 检查订单售后状态
 * @param {number} orderId - 订单ID
 */
export function checkOrderAfterSaleStatus(orderId) {
	return request({
		url: `/member/afterSale/checkOrderAfterSaleStatus`,
		method: 'get',
		params: { 
			orderId,
			_t: Date.now() // 添加时间戳参数防止缓存
		}
	});
} 