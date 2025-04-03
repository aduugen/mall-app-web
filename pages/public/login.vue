<template>
	<view class="container">
		<view class="back-btn yticon icon-zuojiantou-up" @click="navBack"></view>
		<!-- 设置白色背景防止软键盘把下部绝对定位元素顶上来盖住输入框等 -->
		<view class="wrapper">
			<view class="left-top-sign">欢迎回来！</view>
			<view class="input-content">
				<view class="input-item">
					<text class="tit">用户名</text>
					<input type="text" v-model="username" placeholder="请输入用户名" maxlength="11"/>
				</view>
				<view class="input-item">
					<text class="tit">密码</text>
					<input type="text" v-model="password" placeholder="8-18位不含特殊字符的数字、字母组合" placeholder-class="input-empty" maxlength="20"
					 password @confirm="toLogin" />
				</view>
			</view>
			<button class="confirm-btn" @tap.prevent="toLogin" :disabled="logining">登录</button>
			<view class="register-section">
				还没有账号?
				<text @click="toRegist">马上注册</text>
		    </view>
			<view class="forget-section" @click="forgetPassword">
				忘记密码? 
			</view>
		</view>
		
	</view>
</template>

<script>
	import {
		mapMutations
	} from 'vuex';
	import {
		memberLogin,memberInfo
	} from '@/api/member.js';
	import request, { saveToken } from '@/utils/requestUtil.js';
	export default {
		data() {
			return {
				username: '',
				password: '',
				logining: false,
				redirectUrl: '' // 用于存储重定向URL
			}
		},
		onLoad(options) {
			// 获取缓存的用户名和密码
			this.username = uni.getStorageSync('username') || '';
			this.password = uni.getStorageSync('password') || '';
			
			// 清空重定向URL
			this.redirectUrl = '';
			console.log('登录页面已加载，准备登录');
		},
		methods: {
			...mapMutations(['login']),
			navBack() {
				// 简化返回逻辑，始终返回到首页
				console.log('点击返回按钮，返回到首页');
				uni.switchTab({
					url: '/pages/index/index',
					success: () => console.log('返回首页成功'),
					fail: (err) => console.error('返回首页失败', err)
				});
			},
			toRegist() {
				// 直接跳转到注册页面
				uni.navigateTo({
					url: '/pages/public/register'
				});
			},
			async toLogin() {
				console.log('登录按钮点击');
				
				// 表单验证
				if (!this.username.trim()) {
					uni.showToast({
						title: '请输入用户名',
						icon: 'none'
					});
					return;
				}
				
				if (!this.password.trim()) {
					uni.showToast({
						title: '请输入密码',
						icon: 'none'
					});
					return;
				}
				
				// 设置登录状态
				if (this.logining) {
					console.log('登录处理中，请勿重复点击');
					return;
				}
				
				// 设置登录中状态
				this.logining = true;
				
				// 显示加载提示
				uni.showLoading({
					title: '登录中...',
					mask: true
				});
				
				try {
					console.log('发起登录请求');
					const response = await memberLogin({
						username: this.username,
						password: this.password
					});
					console.log('登录请求成功', response);
					
					// 确保正确格式化token
					let token = '';
					if (response.data.tokenHead && response.data.token) {
						// 检查tokenHead是否已包含空格
						const tokenHead = response.data.tokenHead.endsWith(' ') ? 
							response.data.tokenHead : 
							response.data.tokenHead + ' ';
						token = tokenHead + response.data.token;
					} else if (response.data.token) {
						token = 'Bearer ' + response.data.token;
					}
					
					// 保存token和设置过期时间
					saveToken(token);
					uni.setStorageSync('username', this.username);
					uni.setStorageSync('password', this.password);
					
					console.log('获取用户信息');
					const memberInfoResp = await memberInfo();
					this.login(memberInfoResp.data);
					
					// 更新购物车徽标
					this.$store.dispatch('updateCartCount');
					
					// 登录成功，跳转页面
					console.log('登录成功，固定跳转到用户页面');
					
					// 无论是否有重定向URL，都直接跳转到用户页面
					uni.switchTab({
						url: '/pages/user/user',
						success: () => console.log('跳转到用户页面成功'),
						fail: (err) => {
							console.error('跳转到用户页面失败:', err);
							// 如果switchTab失败，尝试使用reLaunch
							uni.reLaunch({
								url: '/pages/user/user',
								success: () => console.log('使用reLaunch跳转到用户页面成功'),
								fail: (e) => console.error('所有跳转方式都失败', e)
							});
						}
					});
				} catch (error) {
					console.error('登录失败', error);
					uni.showToast({
						title: '登录失败，请检查账号密码',
						icon: 'none',
						duration: 2000
					});
				} finally {
					uni.hideLoading(); // 隐藏加载提示
					this.logining = false; // 重置登录状态
				}
			},
			forgetPassword() {
				uni.showToast({
					title: '忘记密码功能暂未开放',
					icon: 'none',
					duration: 2000
				});
			},
		},

	}
</script>

<style lang='scss'>
	page {
		background: #fff;
	}

	.container {
		position: relative;
		width: 100%;
		height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #e9f0fb 100%);
		padding: 40upx;
		box-sizing: border-box;
	}

	.back-btn {
		position: absolute;
		left: 40upx;
		top: 40upx;
		padding-top: var(--status-bar-height);
		font-size: 40upx;
		color: $font-color-dark;
		z-index: 999;
	}

	.wrapper {
		position: relative;
		width: 100%;
		padding: 50upx 40upx;
		margin-top: 150upx;
		background: rgba(255, 255, 255, 0.95);
		border-radius: 20upx;
		box-shadow: 0 15upx 40upx rgba(0, 0, 0, 0.1);
		box-sizing: border-box;
	}

	.left-top-sign {
		font-size: 56upx;
		font-weight: 500;
		margin-bottom: 60upx;
		background: linear-gradient(to right, #4bb0ff, #6149f6);
		-webkit-background-clip: text;
		color: transparent;
	}

	.input-content {
		padding: 0;
	}

	.input-item {
		display: flex;
		flex-direction: column;
		padding: 0 30upx;
		background: #f8f8f8;
		height: 120upx;
		border-radius: 4px;
		margin-bottom: 30upx;
		border-left: 4upx solid #4bb0ff;
	}

	.input-item:last-child {
		margin-bottom: 40upx;
	}

	.input-item .tit {
		height: 40upx;
		line-height: 40upx;
		font-size: 28upx;
		color: #606266;
	}

	.input-item input {
		height: 60upx;
		font-size: 30upx;
		color: #303133;
		width: 100%;
	}

	.confirm-btn {
		width: 100%;
		height: 90upx;
		line-height: 90upx;
		border-radius: 6upx;
		font-size: 32upx;
		color: #fff;
		margin-top: 50upx;
		background: linear-gradient(to right, #4bb0ff, #286090);
		position: relative;  /* 添加相对定位 */
		overflow: hidden;    /* 确保波纹效果在按钮内 */
		
		/* 添加点击状态样式 */
		&:active {
			opacity: 0.8;
			transform: scale(0.98);
		}
	}

	.register-section {
		margin-top: 40upx;
		padding: 20upx 0;
		text-align: center;
		font-size: 28upx;
		color: #606266;
	}

	.register-section text {
		color: #4bb0ff;
		margin-left: 10upx;
	}

	.forget-section {
		text-align: center;
		font-size: 28upx;
		color: #606266;
		margin-top: 20upx;
	}
</style>
