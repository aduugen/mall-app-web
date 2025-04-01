import Request from '@/js_sdk/luch-request/request.js'
import { API_BASE_URL} from '@/utils/appConfig.js';

const http = new Request()

http.setConfig((config) => { /* 设置全局配置 */
	config.baseUrl = API_BASE_URL /* 根域名不同 */
	config.header = {
		'Content-Type': 'application/json;charset=UTF-8',
		...config.header
	}
	config.timeout = 60000 // 设置超时时间为60秒
	return config
})

/**
 * 自定义验证器，如果返回true 则进入响应拦截器的响应成功函数(resolve)，否则进入响应拦截器的响应错误函数(reject)
 * @param { Number } statusCode - 请求响应体statusCode（只读）
 * @return { Boolean } 如果为true,则 resolve, 否则 reject
 */
http.validateStatus = (statusCode) => {
	return statusCode === 200
}

http.interceptor.request((config, cancel) => { /* 请求之前拦截器 */
	const token = uni.getStorageSync('token');
	if(token){
		// 检查token是否已经包含Bearer前缀
		const tokenValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
		config.header = {
			'Authorization': tokenValue,
			...config.header
		}
	}else{
		config.header = {
			...config.header
		}
	}
	/*
	if (!token) { // 如果token不存在，调用cancel 会取消本次请求，但是该函数的catch() 仍会执行
	  cancel('token 不存在') // 接收一个参数，会传给catch((err) => {}) err.errMsg === 'token 不存在'
	}
	*/
	return config
})

http.interceptor.response((response) => { /* 请求之后拦截器 */
	const res = response.data;
	if (res.code !== 200) {
		// 401未登录处理
		if (res.code === 401) {
			// 清除无效token
			uni.removeStorageSync('token');
			// 清除用户信息
			uni.removeStorageSync('userInfo');
			
			setTimeout(() => {
				uni.showModal({
					title: '提示',
					content: '登录已过期，请重新登录',
					showCancel: false,
					success: function() {
						uni.navigateTo({
							url: '/pages/public/login'
						})
					}
				});
			}, 1500);
		} else {
			// 提示错误信息，对于非关键错误不要过度打扰用户
			uni.showToast({
				title: res.message || '请求出错',
				icon: 'none',
				duration: 1500
			});
		}
		return Promise.reject(response);
	} else {
		return response.data;
	}
}, (response) => {
	//提示错误信息
	console.log('response error', response);
	
	// 处理500等服务器错误，可能是由无效token引起的
	if (response.statusCode === 500 || response.statusCode === 401) {
		// 只有在token存在的情况下才提示登录过期
		const token = uni.getStorageSync('token');
		if (token) {
			// 清除相关数据
			uni.removeStorageSync('token');
			uni.removeStorageSync('userInfo');
			
			// 登录过期提示
			uni.showModal({
				title: '提示',
				content: '登录已过期，请重新登录',
				showCancel: false,
				success: function() {
					uni.navigateTo({
						url: '/pages/public/login'
					});
				}
			});
		} else {
			// 如果没有token，可能是其他服务器错误，只在控制台输出
			console.error('服务器错误:', response.statusCode);
		}
	} else {
		// 其他错误提示
		console.error('请求错误:', response.errMsg);
	}
	return Promise.reject(response);
})

export function request (options = {}) {
	return http.request(options);
}

export default request