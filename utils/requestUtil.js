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

// 避免重复显示登录提示
let loginModalShowing = false;

// 显示登录提示弹窗
function showLoginModal() {
	if (loginModalShowing) return;
	
	loginModalShowing = true;
	uni.showModal({
		title: '提示',
		content: '登录已过期，请重新登录',
		showCancel: false,
		success: function(res) {
			loginModalShowing = false;
			if (res.confirm) {
				uni.navigateTo({
					url: '/pages/public/login'
				});
			}
		},
		fail: function() {
			loginModalShowing = false;
		}
	});
}

http.interceptor.request((config, cancel) => { /* 请求之前拦截器 */
	// 打印完整的请求URL信息
	console.log('请求URL:', (config.baseURL || '') + config.url);
	console.log('请求方法:', config.method);
	if (config.params) {
		console.log('请求参数(params):', config.params);
	}
	if (config.data) {
		console.log('请求数据(data):', typeof config.data === 'object' ? JSON.stringify(config.data) : config.data);
		
		// 特别处理，确保data中的reason字段不为null
		if (config.data && typeof config.data === 'object') {
			// 检查并修复reason字段 - 只对特定URL进行处理，避免对所有请求都检查
			const url = config.url || '';
			const isAfterSaleRequest = url.includes('/afterSale') || url.includes('/member/afterSale');
			
			if (isAfterSaleRequest) {
				if (config.data.reason === null || config.data.reason === undefined) {
					// 只对售后相关接口静默设置默认值，不打印警告
					config.data.reason = '用户申请退货/退款';
				}
				
				// 确保reason是字符串类型
				if (config.data.reason !== undefined && typeof config.data.reason !== 'string') {
					config.data.reason = String(config.data.reason);
				}
				
				// 检查items数组中的reason字段
				if (Array.isArray(config.data.items)) {
					config.data.items.forEach((item, index) => {
						if (item.reason === null || item.reason === undefined && item.returnReason === undefined) {
							// 静默修复，不打印警告
							item.reason = config.data.reason || '用户申请退货/退款';
						} else if (item.returnReason && !item.reason) {
							// 如果存在returnReason字段但没有reason字段，则使用returnReason
							item.reason = item.returnReason;
						}
						
						// 确保item.reason是字符串类型
						if (item.reason !== undefined && typeof item.reason !== 'string') {
							item.reason = String(item.reason);
						}
					});
				}
				
				// 只对售后相关请求打印处理后的数据
				console.log('售后请求处理后的数据:', JSON.stringify(config.data));
			}
			
			// 针对发票申请接口，确保member_id字段不为null
			const isInvoiceRequest = url.includes('/invoice/apply');
			if (isInvoiceRequest) {
				// 为请求添加时间戳，避免缓存问题
				config.data._timestamp = Date.now();
				console.log('发票申请请求处理后的数据:', JSON.stringify(config.data));
			}
		}
	}
	
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
			showLoginModal();
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
	console.log('完整响应数据:', JSON.stringify(res)); // 添加完整响应信息日志
	
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
			console.error('收到401未授权错误，详细信息:', JSON.stringify(res)); // 添加401错误的详细日志
			// 清除无效token
			uni.removeStorageSync('token');
			// 清除用户信息
			uni.removeStorageSync('userInfo');
			
			// 显示登录过期提示
			showLoginModal();
			
			return Promise.reject(response);
		} else {
			// 提示错误信息，对于非关键错误不要过度打扰用户
			console.error('API返回错误:', res.code, res.message); // 添加错误码和错误信息日志
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
	console.error('请求错误详情:', JSON.stringify(response)); // 添加更详细的错误日志
	
	// 获取请求的URL和公开API标记
	const url = response.config ? (response.config.url || '') : '';
	const isPublicApi = response.config ? (response.config.isPublicApi || false) : false;
    
	// 记录错误请求的详细信息
    if (response.config) {
        console.log('错误请求详情:', {
            url: response.config.url,
            method: response.config.method,
            data: response.config.data,
            params: response.config.params,
            headers: response.config.header
        });
    }
	
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
		if (token && response.statusCode === 401) {
			// 清除相关数据
			uni.removeStorageSync('token');
			uni.removeStorageSync('userInfo');
			
			// 显示登录过期提示
			showLoginModal();
		} else {
			// 如果没有token或者是其他服务器错误
			console.error('服务器错误:', response.statusCode);
			
			// 对于500错误，显示友好提示
			if (response.statusCode === 500) {
				uni.showToast({
					title: '服务器错误，请稍后再试',
					icon: 'none',
					duration: 2000
				});
			}
		}
	} else {
		// 其他错误提示
		console.error('请求错误:', response.errMsg);
		
		// 显示网络错误提示
		uni.showToast({
			title: '网络请求失败，请检查网络连接',
			icon: 'none',
			duration: 2000
		});
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