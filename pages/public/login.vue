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
			<button class="confirm-btn" @click="toLogin" :disabled="logining">登录</button>
			<view class="register-section">
				还没有账号?
				<text @click="toRegist">马上注册</text>
		    </view>
			<view class="forget-section" @click="toRegist">
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
			this.username = uni.getStorageSync('username') || '';
			this.password = uni.getStorageSync('password') || '';
			
			// 保存重定向URL
			if (options.redirect) {
				this.redirectUrl = decodeURIComponent(options.redirect);
			}
		},
		methods: {
			...mapMutations(['login']),
			navBack() {
				uni.navigateBack();
			},
			toRegist() {
				uni.navigateTo({url:'/pages/public/register'});
			},
			async toLogin() {
				this.logining = true;
				memberLogin({
					username: this.username,
					password: this.password
				}).then(response => {
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
					
					uni.setStorageSync('token', token);
					uni.setStorageSync('username', this.username);
					uni.setStorageSync('password', this.password);
					
					memberInfo().then(response => {
						this.login(response.data);
						this.logining = false;
						
						// 更新购物车徽标
						this.$store.dispatch('updateCartCount');
						
						// 登录成功后，根据情况进行导航
						if (this.redirectUrl) {
							uni.redirectTo({
								url: '/' + this.redirectUrl
							});
						} else {
							uni.navigateBack();
						}
					}).catch(error => {
						console.error('获取用户信息失败', error);
						this.logining = false;
					});
				}).catch((error) => {
					console.error('登录失败', error);
					this.logining = false;
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
		padding-top: 115px;
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: #fff;
		background: linear-gradient(135deg, #f5f7fa 0%, #e9f0fb 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		
		/* 装饰符号元素 */
		&::before, &::after {
			content: '';
			position: absolute;
			width: 400upx;
			height: 400upx;
			z-index: 1;
			opacity: 0.3;
		}
		
		&::before {
			background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234bb0ff"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>') no-repeat;
			background-size: contain;
			top: -50upx;
			left: -100upx;
			transform: rotate(-15deg);
		}
		
		&::after {
			background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23286090"><path d="M7 5h10v2h2V3c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v4h2V5zm8 10H7v-2H5v4c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-4h-2v2z"/><path d="M20.1 7.7l-1.4-1.4L16 8.9l-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4-2.7-2.7z"/></svg>') no-repeat;
			background-size: contain;
			bottom: 0;
			right: -100upx;
			transform: rotate(15deg);
		}
	}
	
	.wrapper {
		position: relative;
		background: rgba(255, 255, 255, 0.02);
		z-index: 90;
		//padding-bottom: 40upx;
		border-radius: 25upx;
		margin: 0 30upx;
		box-shadow: 0 15upx 40upx rgba(0, 0, 0, 0.04);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.8);
		width: auto;
		max-width: 750upx;
		min-height: 50vh;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.back-btn {
		position: absolute;
		left: 40upx;
		z-index: 9999;
		padding-top: var(--status-bar-height);
		top: 40upx;
		font-size: 40upx;
		color: $font-color-dark;
	}

	.left-top-sign {
		font-size: 70upx;
		color: $page-color-base;
		position: relative;
		left: 50upx;
		opacity: 0.8;
		background: linear-gradient(to right, #f1f2f3, #5b4373);
		-webkit-background-clip: text;
		color: transparent;
		text-shadow: 0 5upx 15upx rgba(40, 96, 144, 0.2);
	}
	
	.welcome {
		position: relative;
		left: 50upx;
		top: -90upx;
		font-size: 46upx;
		color: #286090;
		text-shadow: 1px 0px 1px rgba(0, 0, 0, .2);
		font-weight: bold;
		letter-spacing: 2upx;
	}

	.input-content {
		padding: 0 60upx;
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.input-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		padding: 0 30upx;
		background: rgba(255, 255, 255, 0.8);
		height: 120upx;
		border-radius: 10upx;
		margin-bottom: 50upx;
		box-shadow: 0 3upx 10upx rgba(0, 0, 0, 0.05);
		border-left: 4upx solid #4bb0ff;
		transition: all 0.3s;

		&:focus-within {
			border-left: 4upx solid #286090;
			background: rgba(255, 255, 255, 0.95);
			box-shadow: 0 3upx 15upx rgba(0, 0, 0, 0.1);
		}

		&:last-child {
			margin-bottom: 0;
		}

		.tit {
			height: 50upx;
			line-height: 56upx;
			font-size: $font-sm+2upx;
			color: #286090;
			font-weight: bold;
		}

		input {
			height: 60upx;
			font-size: $font-base + 2upx;
			color: $font-color-dark;
			width: 100%;
		}
	}

	.confirm-btn {
		position: relative;
		width: 430upx;
		height: 76upx;
		line-height: 76upx;
		border-radius: 50px;
		margin-top: 70upx;
		background: linear-gradient(to right, #4bb0ff, #286090);
		color: #fff;
		font-size: $font-lg;
		box-shadow: 0 5upx 20upx rgba(40, 96, 144, 0.3);
		transition: all 0.3s;
		
		&:active {
			transform: scale(0.98);
			box-shadow: 0 3upx 10upx rgba(40, 96, 144, 0.2);
		}

		&:after {
			border-radius: 100px;
		}
	}
	
	.forget-section {
	    position: relative;
		font-size: $font-sm+2upx;
		color: #286090;
		text-align: center;
		margin-top: 40upx;
		font-weight: bold;
		
		&:active {
			opacity: 0.7;
		}
	}

	.register-section {
		position: relative;
		left: 0;
		width: 100%;
		font-size: $font-sm+2upx;
		color: $font-color-base;
		text-align: center;
		z-index: 95;
		background: rgba(255, 255, 255, 0.02);
		padding: 20upx 0;
		backdrop-filter: blur(10px);

		text {
			color: #286090;
			margin-left: 10upx;
			font-weight: bold;
			
			&:active {
				opacity: 0.7;
			}
		}
	}
</style>
