import Vue from 'vue'
import Vuex from 'vuex'
import { memberLogout } from '@/api/member.js'
import { fetchCartList } from '@/api/cart.js'

Vue.use(Vuex)

const store = new Vuex.Store({
	state: {
		hasLogin: false,
		userInfo: {},
		cartCount: 0, // 购物车商品数量
	},
	mutations: {
		login(state, provider) {

			state.hasLogin = true;
			state.userInfo = provider;
			uni.setStorage({//缓存用户登陆状态
			    key: 'userInfo',  
			    data: provider  
			}) 
			console.log(state.userInfo);
		},
		logout(state) {
			// 调用后端登出接口
			try {
				memberLogout().catch(err => {
					console.error('退出登录API调用失败:', err);
				});
			} catch (e) {
				console.error('退出登录过程出错:', e);
			}
			
			// 清除本地状态
			state.hasLogin = false;
			state.userInfo = {};
			state.cartCount = 0;
			
			// 清除本地存储
			uni.removeStorage({  
				key: 'userInfo'  
			});
			uni.removeStorage({
				key: 'token'  
			});
			uni.removeStorage({
				key: 'logoutPage'  
			});
			
			// 移除购物车徽标
			uni.removeTabBarBadge({
				index: 3
			});
			
			console.log('用户已登出');
		},
		// 更新购物车商品数量
		setCartCount(state, count) {
			state.cartCount = count;
			// 确保徽标更新在主线程上执行
			setTimeout(() => {
				// 设置购物车徽标
				if (count > 0) {
					uni.setTabBarBadge({
						index: 3, // 购物车的tabBar索引
						text: count.toString()
					});
				} else {
					uni.removeTabBarBadge({
						index: 3
					});
				}
			}, 0);
		}
	},
	actions: {
		// 获取购物车数量
		async updateCartCount({commit, state}) {
			if (!state.hasLogin) {
				commit('setCartCount', 0);
				return Promise.resolve(0);
			}
			
			try {
				const response = await fetchCartList();
				let count = 0;
				if (response && response.data && response.data.length) {
					// 计算购物车中所有商品数量总和
					count = response.data.reduce((sum, item) => sum + item.quantity, 0);
				}
				commit('setCartCount', count);
				return Promise.resolve(count);
			} catch (error) {
				console.error('获取购物车数量失败:', error);
				// 发生错误时，保持当前购物车数量不变
				return Promise.resolve(state.cartCount);
			}
		}
	}
})

export default store
