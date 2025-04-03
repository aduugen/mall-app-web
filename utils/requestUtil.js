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
	// 获取请求的URL，用于判断是否为公开API
	const url = config.url || '';
	// 公开API列表，这些API不需要登录即可访问
	const publicApis = [
		'/product/detail/', 
		'/product/categoryTreeList', 
		'/product/search',
		'/home/',
		'/cart/list',
		'/brand/'
	];
	
	// 检查当前请求是否是公开API
	const isPublicApi = publicApis.some(api => url.includes(api));
	
	// 设置公开API标记，用于后续识别
	config.isPublicApi = isPublicApi;
	
	// 检查token是否存在且是否有效
	const token = uni.getStorageSync('token');
	const tokenExpireTime = uni.getStorageSync('tokenExpireTime');
	const currentTime = Date.now();
	
	// 如果token存在但已过期，先清除token
	if (token && tokenExpireTime && currentTime > tokenExpireTime) {
		console.log('Token已过期，清除token');
		uni.removeStorageSync('token');
		uni.removeStorageSync('tokenExpireTime');
		
		// 对于非公开API，可以直接取消请求
		if (!isPublicApi) {
			// 如果不是公开API且token已过期，显示登录提示并取消请求
			if (!getApp().loginModalShown) {
				getApp().loginModalShown = true;
				
				uni.showModal({
					title: '提示',
					content: '登录已过期，请重新登录',
					showCancel: false,
					success: function(res) {
						getApp().loginModalShown = false;
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/public/login'
							});
						}
					},
					fail: function() {
						getApp().loginModalShown = false;
					}
				});
			}
			// 取消当前请求
			cancel('登录已过期');
			return;
		}
	}
	
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
	
	// 确保PUT和POST请求的Content-Type正确设置
	if (config.method === 'PUT' || config.method === 'POST') {
		config.header = {
			'Content-Type': 'application/json;charset=UTF-8',
			...config.header
		}
	}
	
	// 如果游客访问非公开API且没有token，可以取消请求并提示登录
	// 但对于公开API，即使没有token也不取消请求
	if (!token && !isPublicApi) {
		// 这里也可以选择取消请求，但为了避免过度干扰用户体验，先不取消
		console.log('未登录访问非公开API:', url);
	}
	
	return config
})

http.interceptor.response((response) => { /* 请求之后拦截器 */
	const res = response.data;
	
	// 获取请求的URL和公开API标记
	const url = response.config.url || '';
	const isPublicApi = response.config.isPublicApi || false;
	
	// 记录响应状态，用于调试
	console.log(`API响应 [${url}]: 状态码=${res.code}, 公开API=${isPublicApi}`);
	
	if (res.code !== 200) {
		// 对于公开API，即使返回错误也不要弹窗提示
		if (isPublicApi) {
			console.log('公开API返回非200状态码:', url, res.code, res.message);
			// 对于公开API的错误，如果是401，直接返回数据，静默处理
			if (res.code === 401) {
				console.log('公开API返回401，静默处理');
				return res;
			}
			// 其他错误返回reject但标记为静默处理
			return Promise.reject({
				silent: true, // 标记为静默错误，不显示提示
				data: res
			});
		}
		
		// 401未登录处理 - 只处理非公开API的401错误
		if (res.code === 401) {
			// 清除无效token
			uni.removeStorageSync('token');
			// 清除用户信息
			uni.removeStorageSync('userInfo');
			
			// 避免重复显示登录提示框
			if (!getApp().loginModalShown) {
				getApp().loginModalShown = true;
				
				setTimeout(() => {
					uni.showModal({
						title: '提示',
						content: '登录已过期，请重新登录',
						showCancel: false,
						success: function(res) {
							getApp().loginModalShown = false;
							if (res.confirm) {
								uni.navigateTo({
									url: '/pages/public/login'
								});
							}
						},
						fail: function() {
							getApp().loginModalShown = false;
						}
					});
				}, 50);
			}
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
	
	// 获取请求的URL和公开API标记
	const url = response.config ? (response.config.url || '') : '';
	const isPublicApi = response.config ? (response.config.isPublicApi || false) : false;
	
	// 处理500等服务器错误，可能是由无效token引起的
	if (response.statusCode === 500 || response.statusCode === 401) {
		// 如果是公开API，不提示登录，只打印日志
		if (isPublicApi) {
			console.log('公开API请求错误，静默处理:', url, response.statusCode);
			return Promise.reject({
				silent: true,
				data: response
			});
		}
		
		// 只有在token存在的情况下才提示登录过期
		const token = uni.getStorageSync('token');
		if (token) {
			// 清除相关数据
			uni.removeStorageSync('token');
			uni.removeStorageSync('userInfo');
			
			// 避免重复显示登录提示框
			if (!getApp().loginModalShown) {
				getApp().loginModalShown = true;
				
				// 登录过期提示
				uni.showModal({
					title: '提示',
					content: '登录已过期，请重新登录',
					showCancel: false,
					success: function(res) {
						getApp().loginModalShown = false;
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/public/login'
							});
						}
					},
					fail: function() {
						getApp().loginModalShown = false;
					}
				});
			}
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

export function saveToken(token) {
	// 设置token
	uni.setStorageSync('token', token);
	// 设置过期时间为24小时后
	const expireTime = Date.now() + 24 * 60 * 60 * 1000;
	uni.setStorageSync('tokenExpireTime', expireTime);
}

export default request