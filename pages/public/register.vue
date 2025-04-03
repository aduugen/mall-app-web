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
				try {
					await memberRegister({
						username: this.username,
						password: this.password,
						telephone: this.mobile,
						authCode: this.code // 使用默认验证码
					});
					
					uni.showToast({
						title: '注册成功',
						icon: 'success'
					});
					
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/public/login'
						});
					}, 1000);
				} catch (error) {
					console.error('注册失败', error);
					uni.showToast({
						title: '注册失败，请稍后再试',
						icon: 'none',
						duration: 2000
					});
				} finally {
					this.registering = false;
				}
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
		margin-top: 40upx;
		background: linear-gradient(to right, #4bb0ff, #286090);
	}

	.login-section {
		margin-top: 40upx;
		padding: 20upx 0;
		text-align: center;
		font-size: 28upx;
		color: #606266;
	}

	.login-section text {
		color: #4bb0ff;
		margin-left: 10upx;
	}
</style>
