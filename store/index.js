import Vue from 'vue'
import Vuex from 'vuex'
import { memberLogout } from '@/api/member.js'

Vue.use(Vuex)

const store = new Vuex.Store({
	state: {
		hasLogin: false,
		userInfo: {},
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
			
			// 清除本地存储
			uni.removeStorage({  
                key: 'userInfo'  
            });
			uni.removeStorage({
			    key: 'token'  
			});
			
			console.log('用户已登出');
		}
	},
	actions: {
	
	}
})

export default store
