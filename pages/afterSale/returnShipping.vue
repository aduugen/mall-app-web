<template>
	<view class="content">
		<!-- 顶部标题栏 -->
		<view class="page-header">
			<view class="back-btn" @click="goBack">
				<text class="yticon icon-zuojiantou"></text>
			</view>
			<view class="page-title">寄回商品</view>
			<view class="placeholder"></view>
		</view>
		
		<view v-if="loading" class="loading-container">
			<text>正在加载...</text>
		</view>
		<view v-else-if="loadError" class="error-container">
			<view class="error-icon">
				<text class="yticon icon-jujue"></text>
			</view>
			<text class="error-text">{{errorMessage || '获取寄回信息失败，请稍后重试'}}</text>
			<button class="retry-btn" @click="retryLoading">重新加载</button>
		</view>
		
		<view v-else class="return-shipping-container">
			<!-- 收件人信息区域 -->
			<view class="info-section receiver-info">
				<view class="info-title">收件人信息</view>
				<view class="info-content" v-if="shipInfo.receiver">
					<view class="info-item">
						<text class="info-label">收件人:</text>
						<text class="info-value">{{shipInfo.receiver.name}}</text>
					</view>
					<view class="info-item">
						<text class="info-label">联系电话:</text>
						<text class="info-value">{{shipInfo.receiver.phone}}</text>
					</view>
					<view class="info-item">
						<text class="info-label">收件地址:</text>
						<text class="info-value">{{shipInfo.receiver.address}}</text>
					</view>
				</view>
				<view class="info-empty" v-else>
					<text>暂无收件人信息，请联系客服获取</text>
				</view>
			</view>
			
			<!-- 寄件人信息区域 -->
			<view class="info-section sender-info">
				<view class="info-title">寄件人信息</view>
				<view class="info-content" v-if="shipInfo.sender">
					<view class="info-item">
						<text class="info-label">寄件人:</text>
						<text class="info-value">{{shipInfo.sender.name}}</text>
					</view>
					<view class="info-item">
						<text class="info-label">联系电话:</text>
						<text class="info-value">{{shipInfo.sender.phone}}</text>
					</view>
					<view class="info-item">
						<text class="info-label">寄件地址:</text>
						<text class="info-value">{{shipInfo.sender.address}}</text>
					</view>
				</view>
				<view class="info-empty" v-else>
					<text>暂无寄件人信息</text>
				</view>
			</view>
			
			<!-- 物流信息表单 -->
			<view class="form-section">
				<view class="form-title">物流信息</view>
				<view class="form-item">
					<text class="form-label required">快递公司</text>
					<picker :value="logisticsCompanyIndex" :range="logisticsCompanies" range-key="name" @change="onLogisticsCompanyChange">
						<view class="picker-view">
							<text v-if="logisticsCompanyIndex >= 0">{{logisticsCompanies[logisticsCompanyIndex].name}}</text>
							<text v-else class="placeholder">请选择快递公司</text>
							<text class="picker-arrow yticon icon-youjiantou"></text>
						</view>
					</picker>
				</view>
				
				<view class="form-item">
					<text class="form-label required">物流单号</text>
					<input class="form-input" type="text" v-model="returnShipForm.logisticsNumber" placeholder="请输入物流单号" />
				</view>
				
				<view class="form-item">
					<text class="form-label required">寄件人</text>
					<input class="form-input" type="text" v-model="returnShipForm.returnName" placeholder="请输入寄件人姓名" />
				</view>
				
				<view class="form-item">
					<text class="form-label required">寄件人电话</text>
					<input class="form-input" type="text" v-model="returnShipForm.returnPhone" placeholder="请输入寄件人电话" />
				</view>
			</view>
			
			<!-- 提交按钮 -->
			<view class="submit-section">
				<button class="submit-btn" @click="submitReturnShipping">提交物流信息</button>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		submitReturnShipping,
		getReturnShippingInfo,
		getLogisticsCompanies
	} from '@/api/afterSale';
	
	export default {
		data() {
			return {
				afterSaleId: null,     // 售后单ID
				loading: true,         // 加载状态
				loadError: false,      // 加载错误状态
				errorMessage: '',      // 错误信息
				
				// 寄回商品相关数据
				returnShipForm: {
					afterSaleId: null,
					logisticsCompanyId: '',
					logisticsNumber: '',
					returnName: '',
					returnPhone: ''
				},
				shipInfo: {
					receiver: null,
					sender: null
				},
				logisticsCompanyIndex: -1,
				logisticsCompanies: []
			};
		},
		onLoad() {
			// 获取afterSaleId参数
			this.afterSaleId = this.$route.query.id;
			
			if (this.afterSaleId) {
				// 初始化表单
				this.returnShipForm.afterSaleId = this.afterSaleId;
				// 加载寄回信息
				this.loadReturnShippingInfo();
				// 加载物流公司列表
				this.loadLogisticsCompanies();
			} else {
				this.loading = false;
				this.loadError = true;
				this.errorMessage = '未指定售后单ID';
			}
		},
		methods: {
			// 返回上一页
			goBack() {
				uni.navigateBack();
			},
			
			// 重新加载
			retryLoading() {
				this.loading = true;
				this.loadError = false;
				this.loadReturnShippingInfo();
				this.loadLogisticsCompanies();
			},
			
			// 加载物流公司列表
			loadLogisticsCompanies() {
				getLogisticsCompanies()
					.then(res => {
						if (res.code === 200 && res.data) {
							this.logisticsCompanies = res.data;
							console.log('物流公司列表:', this.logisticsCompanies);
						} else {
							// 如果API请求失败，设置默认物流公司
							this.logisticsCompanies = [
								{ id: '1', name: '顺丰速运', code: 'SF' },
								{ id: '2', name: '圆通速递', code: 'YTO' },
								{ id: '3', name: '中通快递', code: 'ZTO' },
								{ id: '4', name: '申通快递', code: 'STO' },
								{ id: '5', name: '韵达速递', code: 'YD' },
								{ id: '6', name: '邮政快递包裹', code: 'YZPY' },
								{ id: '7', name: '京东物流', code: 'JD' },
								{ id: '8', name: '德邦快递', code: 'DBL' },
								{ id: '9', name: '百世快递', code: 'HTKY' }
							];
							console.log('使用默认物流公司列表');
						}
					})
					.catch(error => {
						console.error('获取物流公司列表失败:', error);
						// 设置默认物流公司
						this.logisticsCompanies = [
							{ id: '1', name: '顺丰速运', code: 'SF' },
							{ id: '2', name: '圆通速递', code: 'YTO' },
							{ id: '3', name: '中通快递', code: 'ZTO' },
							{ id: '4', name: '申通快递', code: 'STO' },
							{ id: '5', name: '韵达速递', code: 'YD' },
							{ id: '6', name: '邮政快递包裹', code: 'YZPY' },
							{ id: '7', name: '京东物流', code: 'JD' },
							{ id: '8', name: '德邦快递', code: 'DBL' },
							{ id: '9', name: '百世快递', code: 'HTKY' }
						];
						console.log('使用默认物流公司列表');
					});
			},
			
			// 加载寄回商品信息
			loadReturnShippingInfo() {
				this.loading = true;
				
				getReturnShippingInfo(this.afterSaleId)
					.then(res => {
						this.loading = false;
						
						if (res.code === 200 && res.data) {
							// 设置收件人和寄件人信息
							this.shipInfo = res.data;
							
							console.log('获取寄回信息成功:', this.shipInfo);
							
							// 如果有寄件人信息，填充到表单
							if (this.shipInfo.sender) {
								this.returnShipForm.returnName = this.shipInfo.sender.name || '';
								this.returnShipForm.returnPhone = this.shipInfo.sender.phone || '';
							}
						} else {
							this.loadError = true;
							this.errorMessage = res.message || '获取寄回信息失败，请联系客服';
							console.error('获取寄回信息失败:', res);
						}
					})
					.catch(error => {
						this.loading = false;
						this.loadError = true;
						this.errorMessage = '网络异常，请稍后重试';
						console.error('获取寄回信息异常:', error);
					});
			},
			
			// 处理物流公司选择
			onLogisticsCompanyChange(e) {
				this.logisticsCompanyIndex = e.detail.value;
				// 设置物流公司ID
				if (this.logisticsCompanyIndex >= 0 && this.logisticsCompanies[this.logisticsCompanyIndex]) {
					this.returnShipForm.logisticsCompanyId = this.logisticsCompanies[this.logisticsCompanyIndex].id;
				}
			},
			
			// 提交寄回物流信息
			submitReturnShipping() {
				// 表单验证
				if (!this.returnShipForm.logisticsCompanyId) {
					uni.showToast({
						title: '请选择物流公司',
						icon: 'none'
					});
					return;
				}
				
				if (!this.returnShipForm.logisticsNumber) {
					uni.showToast({
						title: '请输入物流单号',
						icon: 'none'
					});
					return;
				}
				
				if (!this.returnShipForm.returnName) {
					uni.showToast({
						title: '请输入寄件人姓名',
						icon: 'none'
					});
					return;
				}
				
				if (!this.returnShipForm.returnPhone) {
					uni.showToast({
						title: '请输入寄件人电话',
						icon: 'none'
					});
					return;
				}
				
				// 显示加载中
				uni.showLoading({
					title: '提交中...'
				});
				
				console.log('提交寄回物流信息:', this.returnShipForm);
				
				// 提交物流信息
				submitReturnShipping(this.returnShipForm)
					.then(response => {
						uni.hideLoading();
						
						if (response.code === 200) {
							uni.showToast({
								title: '提交成功',
								icon: 'success'
							});
							
							// 通知列表页面刷新
							uni.$emit('afterSaleListRefresh');
							
							// 延迟返回上一页
							setTimeout(() => {
								uni.navigateBack();
							}, 1500);
						} else {
							uni.showToast({
								title: response.message || '提交失败',
								icon: 'none'
							});
						}
					})
					.catch(error => {
						uni.hideLoading();
						console.error('提交物流信息失败:', error);
						
						uni.showToast({
							title: '提交失败，请稍后重试',
							icon: 'none'
						});
					});
			}
		}
	}
</script>

<style lang="scss">
	.content {
		min-height: 100vh;
		background-color: #f8f8f8;
	}
	
	.page-header {
		display: flex;
		align-items: center;
		height: 90rpx;
		background-color: #ffffff;
		padding: 0 30rpx;
		position: relative;
		
		.back-btn {
			width: 60rpx;
			height: 60rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.yticon {
				font-size: 40rpx;
				color: #333;
			}
		}
		
		.page-title {
			flex: 1;
			text-align: center;
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
			margin-left: -60rpx; /* 抵消返回按钮的宽度，保持标题居中 */
		}
		
		.placeholder {
			width: 60rpx;
		}
	}
	
	.loading-container {
		display: flex;
		justify-content: center;
		padding: 40rpx 0;
		color: #999;
		font-size: 28rpx;
	}
	
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;
		
		.error-icon {
			font-size: 100rpx;
			color: #003366;
			margin-bottom: 30rpx;
		}
		
		.error-text {
			font-size: 28rpx;
			color: #666;
			margin-bottom: 40rpx;
		}
		
		.retry-btn {
			padding: 15rpx 40rpx;
			background-color: #003366;
			color: #fff;
			border-radius: 40rpx;
			font-size: 28rpx;
		}
	}
	
	.return-shipping-container {
		padding: 30rpx;
	}
	
	.info-section {
		margin-bottom: 30rpx;
		background-color: #fff;
		border-radius: 10rpx;
		padding: 20rpx;
		
		&.receiver-info {
			border-left: 4rpx solid #007aff;
		}
		
		&.sender-info {
			border-left: 4rpx solid #4cd964;
		}
		
		.info-title {
			font-size: 28rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 15rpx;
		}
		
		.info-content {
			.info-item {
				display: flex;
				margin-bottom: 10rpx;
				
				.info-label {
					width: 150rpx;
					font-size: 26rpx;
					color: #666;
					flex-shrink: 0;
				}
				
				.info-value {
					flex: 1;
					font-size: 26rpx;
					color: #333;
					word-break: break-all;
				}
			}
		}
		
		.info-empty {
			padding: 20rpx 0;
			text-align: center;
			font-size: 26rpx;
			color: #999;
		}
	}
	
	.form-section {
		background-color: #fff;
		border-radius: 10rpx;
		padding: 20rpx;
		margin-bottom: 30rpx;
		
		.form-title {
			font-size: 28rpx;
			font-weight: bold;
			color: #333;
			margin-bottom: 20rpx;
		}
		
		.form-item {
			margin-bottom: 20rpx;
			
			.form-label {
				font-size: 26rpx;
				color: #333;
				margin-bottom: 10rpx;
				display: block;
				
				&.required:after {
					content: '*';
					color: #ff3b30;
					margin-left: 5rpx;
				}
			}
			
			.form-input {
				height: 80rpx;
				border: 1rpx solid #ddd;
				border-radius: 8rpx;
				padding: 0 20rpx;
				font-size: 26rpx;
				background-color: #fff;
				width: 100%;
				box-sizing: border-box;
			}
			
			.picker-view {
				height: 80rpx;
				border: 1rpx solid #ddd;
				border-radius: 8rpx;
				padding: 0 20rpx;
				font-size: 26rpx;
				background-color: #fff;
				display: flex;
				align-items: center;
				justify-content: space-between;
				
				.placeholder {
					color: #999;
				}
				
				.picker-arrow {
					color: #999;
					font-size: 24rpx;
				}
			}
		}
	}
	
	.submit-section {
		padding: 20rpx 0;
		
		.submit-btn {
			width: 100%;
			height: 90rpx;
			line-height: 90rpx;
			background-color: #ff6600;
			color: #fff;
			font-size: 30rpx;
			border-radius: 45rpx;
			text-align: center;
			box-shadow: 0 5rpx 10rpx rgba(255, 102, 0, 0.3);
		}
	}
</style> 