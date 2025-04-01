<template>
	<view class="container">
		<view class="left-bottom-sign"></view>
		<view class="back-btn yticon icon-zuojiantou-up" @click="navBack"></view>
		<!-- 设置白色背景防止软键盘把下部绝对定位元素顶上来盖住输入框等 -->
		<view class="wrapper">			
			<view class="left-top-sign">
				欢迎注册账号！
			</view>
			
			<view class="input-content">
				<view class="input-item">
					<text class="tit">用户名</text>
					<input type="text" v-model="username" placeholder="请输入用户名" maxlength="20"/>
				</view>
				<view class="input-item">
					<text class="tit">密码</text>
					<input type="password" v-model="password" placeholder="8-18位不含特殊字符的数字、字母组合" placeholder-class="input-empty" maxlength="20"/>
				</view>
				<view class="input-item">
					<text class="tit">手机号码</text>
					<input type="number" v-model="mobile" placeholder="请输入手机号码" maxlength="11"/>
				</view>
				<view class="input-item">
					<text class="tit">验证码</text>
					<input type="text" v-model="code" placeholder="请输入验证码" maxlength="6"/>
				</view>
			</view>
			
			<button class="confirm-btn" @click="handleRegister" :disabled="registering">立即注册</button>
			
			<view class="login-section">
				已有账号?
				<text @click="toLogin">去登录</text>
			</view>
			
			<view class="empty" v-if="false">
				<image src="/static/qrcode_for_macrozheng_258.jpg" mode="aspectFit"></image>
				<view class="empty-tips">
					扫描上方二维码<view class="navigator">关注公众号</view>，
				</view>
				<view class="empty-tips">
					回复<view class="navigator">会员</view>获取体验账号。
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { memberRegister } from '@/api/member.js';
	
	export default {
		data() {
			return {
				username: '',
				password: '',
				mobile: '',
				code: '123456', // 默认验证码
				registering: false
			}
		},
		onLoad() {
		},
		methods: {
			navBack() {
				uni.navigateBack();
			},
			toLogin() {
				uni.navigateTo({
					url: '/pages/public/login'
				});
			},
			async handleRegister() {
				// 简单验证
				if(!this.username) {
					uni.showToast({
						title: '请输入用户名',
						icon: 'none'
					});
					return;
				}
				if(!this.password) {
					uni.showToast({
						title: '请输入密码',
						icon: 'none'
					});
					return;
				}
				if(!this.mobile) {
					uni.showToast({
						title: '请输入手机号',
						icon: 'none'
					});
					return;
				}
				
				this.registering = true;
				memberRegister({
					username: this.username,
					password: this.password,
					telephone: this.mobile,
					authCode: this.code // 使用默认验证码
				}).then(response => {
					uni.showToast({
						title: '注册成功'
					});
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/public/login'
						});
					}, 1000);
				}).catch(() => {
					this.registering = false;
				});
			}
		},
	}
</script>

<style lang='scss'>
	page {
		background: #fff;
	}
	
	.empty {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100vh;
		padding-bottom: 100upx;
		display: flex;
		justify-content: center;
		flex-direction: column;
		align-items: center;
		background: #fff;
	
		image {
			width: 420upx;
			height: 420upx;
			margin-bottom: 30upx;
		}
		.empty-tips {
			display: flex;
			font-size: $font-sm+16upx;
			color: $font-color-disabled;
		
			.navigator {
				color: $uni-color-primary;
				margin-left: 0upx;
			}
		}
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
		z-index: 90;
		background: rgba(255, 255, 255, 0.02);
		margin-top: -100upx;
		border-radius: 20upx;
		margin-left: 30upx;
		margin-right: 30upx;
		box-shadow: 0 15upx 40upx rgba(0, 0, 0, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.8);
		width: auto;
		max-width: 750upx;
		min-height: 50vh;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		//overflow-y: auto;
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
		margin-top: 50upx;
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

	.login-section {
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
