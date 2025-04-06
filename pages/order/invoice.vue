<template>
	<view class="content">
		<view class="invoice-container">
			<view class="form-box">
				<view class="form-item">
					<text class="label">发票类型</text>
					<view class="input-box">
						<radio-group @change="invoiceTypeChange">
							<label class="radio">
								<radio value="1" :checked="invoiceForm.type == 1" color="#fa436a" />电子发票
							</label>
							<label class="radio" style="margin-left: 20rpx;">
								<radio value="2" :checked="invoiceForm.type == 2" color="#fa436a" />纸质发票
							</label>
						</radio-group>
					</view>
				</view>
				
				<view class="form-item">
					<text class="label">发票抬头</text>
					<view class="input-box">
						<radio-group @change="titleTypeChange">
							<label class="radio">
								<radio value="1" :checked="invoiceForm.titleType == 1" color="#fa436a" />个人
							</label>
							<label class="radio" style="margin-left: 20rpx;">
								<radio value="2" :checked="invoiceForm.titleType == 2" color="#fa436a" />企业
							</label>
						</radio-group>
					</view>
				</view>
				
				<view class="form-item">
					<text class="label">{{ invoiceForm.titleType == 1 ? '个人姓名' : '企业名称' }}</text>
					<input class="input" type="text" v-model="invoiceForm.title" placeholder="请输入发票抬头"/>
				</view>
				
				<view class="form-item" v-if="invoiceForm.titleType == 2">
					<text class="label">税号</text>
					<input class="input" type="text" v-model="invoiceForm.taxNumber" placeholder="请输入纳税人识别号"/>
				</view>
				
				<view class="form-item">
					<text class="label">发票内容</text>
					<picker @change="contentChange" :value="contentIndex" :range="contentList">
						<view class="picker-box">
							{{contentList[contentIndex]}}
							<text class="yticon icon-you"></text>
						</view>
					</picker>
				</view>
				
				<view class="form-item" v-if="invoiceForm.type == 1">
					<text class="label">收票邮箱</text>
					<input class="input" type="text" v-model="invoiceForm.email" placeholder="请输入接收电子发票的邮箱"/>
				</view>
				
				<view class="form-item" v-if="invoiceForm.type == 2">
					<text class="label">收件人</text>
					<input class="input" type="text" v-model="invoiceForm.receiverName" placeholder="请输入收件人姓名"/>
				</view>
				
				<view class="form-item" v-if="invoiceForm.type == 2">
					<text class="label">联系电话</text>
					<input class="input" type="text" v-model="invoiceForm.receiverPhone" placeholder="请输入联系电话"/>
				</view>
				
				<view class="form-item" v-if="invoiceForm.type == 2">
					<text class="label">收件地址</text>
					<textarea class="textarea" v-model="invoiceForm.receiverAddress" placeholder="请输入详细地址"/>
				</view>
			</view>
			
			<view class="order-info">
				<view class="info-item">
					<text class="label">订单编号</text>
					<text class="value">{{orderSn}}</text>
				</view>
				<view class="info-item">
					<text class="label">订单金额</text>
					<text class="value price">¥{{orderAmount}}</text>
				</view>
			</view>
			
			<button class="submit-btn" @click="submitInvoice">提交申请</button>
		</view>
	</view>
</template>

<script>
	import {
		fetchOrderDetail
	} from '@/api/order.js';

	import {
		applyInvoice,
		checkOrderInvoice
	} from '@/api/invoice.js';

	export default {
		data() {
			return {
				response: null,
				orderId: null,
				orderSn: '',
				orderAmount: '0.00',
				contentList: ['商品明细', '商品类别'],
				contentIndex: 0,
				invoiceForm: {
					type: 1, // 1-电子发票 2-纸质发票
					titleType: 1, // 1-个人 2-企业
					title: '', // 发票抬头
					taxNumber: '', // 税号
					content: '商品明细', // 发票内容
					email: '', // 收票邮箱
					receiverName: '', // 收件人
					receiverPhone: '', // 联系电话
					receiverAddress: '' // 收件地址
				}
			};
		},
		onLoad(options) {
			if (options.orderId) {
				this.orderId = options.orderId;
				console.log('order id is:', this.orderId);
				
				// 检查订单是否已申请过发票
				uni.showLoading({
					title: '检查发票状态'
				});
				
				checkOrderInvoice(this.orderId).then(res => {
					uni.hideLoading();
					if (res.code === 200) {
						if (res.data.isApplied) {
							uni.showModal({
								title: '温馨提示',
								content: '该订单发票申请已提交，请前往我的发票查看申请进展',
								confirmText: '查看发票',
								cancelText: '返回',
								success: (result) => {
									if (result.confirm) {
										// 跳转到我的发票页面
										uni.navigateTo({
											url: '/pages/order/invoice-list'
										});
									} else {
										uni.navigateBack();
									}
								}
							});
							return;
						}
						
						// 获取订单信息
						this.getOrderInfo();
					} else {
						uni.showToast({
							title: '检查发票状态失败',
							icon: 'none'
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					}
				}).catch(err => {
					uni.hideLoading();
					uni.showToast({
						title: '检查发票状态失败',
						icon: 'none'
					});
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				});
			}
		},
		methods: {
			// 获取订单信息
			getOrderInfo() {
				// 调用获取订单详情的API
				uni.showLoading({
					title: '加载中'
				});
				
				// 添加日志
				console.log('开始获取订单信息，orderId:', this.orderId);
				
				fetchOrderDetail(this.orderId).then(res => {
						console.log('获取订单详情响应:', res);
						// 注意：res 本身就是响应数据，不需要通过 res.data 获取
						if (res && res.code === 200) { 
							const orderDetail = res.data;
							this.orderSn = orderDetail.orderSn;
							this.orderAmount = orderDetail.totalAmount;
							
							console.log('订单信息处理成功，orderSn:', this.orderSn);
							
							// 自动填充用户信息
							if (orderDetail.memberUsername) {
								this.invoiceForm.title = orderDetail.memberUsername;
							}
							if (orderDetail.receiverName) {
								this.invoiceForm.receiverName = orderDetail.receiverName;
							}
							if (orderDetail.receiverPhone) {
								this.invoiceForm.receiverPhone = orderDetail.receiverPhone;
							}
							if (orderDetail.receiverDetailAddress) {
								this.invoiceForm.receiverAddress = 
									orderDetail.receiverProvince + 
									orderDetail.receiverCity + 
									orderDetail.receiverRegion + 
									orderDetail.receiverDetailAddress;
							}
						} else {
							console.error('获取订单信息失败', res);
							this.showToast('获取订单信息失败: ' + (res ? res.message : '未知错误'));
						}
					})
					.catch(err => {
						console.error('获取订单信息异常', err);
						this.showToast('获取订单信息失败: ' + (err.message || '服务器错误'));
					})
					.finally(() => {
						// 确保在任何情况下都会隐藏加载提示
						setTimeout(() => {
							uni.hideLoading();
						}, 500);
					});
			},
			
			// 发票类型切换
			invoiceTypeChange(e) {
				this.invoiceForm.type = parseInt(e.detail.value);
			},
			
			// 抬头类型切换
			titleTypeChange(e) {
				this.invoiceForm.titleType = parseInt(e.detail.value);
				if (this.invoiceForm.titleType === 1) {
					this.invoiceForm.taxNumber = '';
				}
			},
			
			// 发票内容切换
			contentChange(e) {
				this.contentIndex = e.detail.value;
				this.invoiceForm.content = this.contentList[this.contentIndex];
			},
			
			// 提交发票申请
			submitInvoice() {
				// 表单验证
				if (!this.invoiceForm.title) {
					this.showToast('请输入发票抬头');
					return;
				}
				
				if (this.invoiceForm.titleType === 2 && !this.invoiceForm.taxNumber) {
					this.showToast('请输入税号');
					return;
				}
				
				if (this.invoiceForm.type === 1 && !this.invoiceForm.email) {
					this.showToast('请输入收票邮箱');
					return;
				}
				
				if (this.invoiceForm.type === 2) {
					if (!this.invoiceForm.receiverName) {
						this.showToast('请输入收件人');
						return;
					}
					if (!this.invoiceForm.receiverPhone) {
						this.showToast('请输入联系电话');
						return;
					}
					if (!this.invoiceForm.receiverAddress) {
						this.showToast('请输入收件地址');
						return;
					}
				}
				
				// 提交表单数据
				uni.showLoading({
					title: '提交中'
				});
				
				// 构建提交数据
				const params = {
					orderId: parseInt(this.orderId),
					orderSn: this.orderSn,
					invoiceType: this.invoiceForm.type,
					titleType: this.invoiceForm.titleType,
					invoiceTitle: this.invoiceForm.title,
					taxNumber: this.invoiceForm.taxNumber,
					invoiceContent: this.invoiceForm.content,
					receiverEmail: this.invoiceForm.email,
					receiverName: this.invoiceForm.receiverName,
					receiverPhone: this.invoiceForm.receiverPhone,
					receiverAddress: this.invoiceForm.receiverAddress
				};
				
				console.log('提交发票申请参数:', params);
				
				// 调用申请发票API
				applyInvoice(params).then(res => {
					uni.hideLoading();
					if (res.code === 200) {
						// 通知订单列表页刷新
						uni.$emit('orderListRefresh');
						
						uni.showToast({
							title: '申请成功',
							icon: 'success',
							duration: 2000,
							success: () => {
								// 2秒后返回上一页
								setTimeout(() => {
									uni.navigateBack();
								}, 2000);
							}
						});
					} else {
						uni.showToast({
							title: res.message || '申请失败',
							icon: 'none'
						});
					}
				}).catch(err => {
					uni.hideLoading();
					uni.showToast({
						title: '申请发票失败',
						icon: 'none'
					});
				});
			},
			
			// 显示提示
			showToast(title) {
				uni.showToast({
					title: title,
					icon: 'none'
				});
			}
		}
	}
</script>

<style lang="scss">
	.content {
		background-color: #f8f8f8;
		min-height: 100vh;
	}
	
	.invoice-container {
		padding: 20rpx;
	}
	
	.form-box {
		background-color: #fff;
		border-radius: 15rpx;
		padding: 20rpx 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}
	
	.form-item {
		display: flex;
		padding: 25rpx 0;
		border-bottom: 1rpx solid #eee;
		
		&:last-child {
			border-bottom: none;
		}
		
		.label {
			width: 180rpx;
			font-size: 28rpx;
			color: #333;
			font-weight: 500;
		}
		
		.input-box {
			flex: 1;
		}
		
		.radio {
			font-size: 28rpx;
			color: #333;
		}
		
		.input {
			flex: 1;
			height: 60rpx;
			font-size: 28rpx;
			color: #333;
		}
		
		.textarea {
			width: 100%;
			height: 160rpx;
			font-size: 28rpx;
			color: #333;
			padding: 10rpx;
			background-color: #f9f9f9;
			border-radius: 6rpx;
		}
		
		.picker-box {
			font-size: 28rpx;
			color: #333;
			display: flex;
			align-items: center;
			justify-content: space-between;
			
			.yticon {
				color: #ccc;
				font-size: 32rpx;
			}
		}
	}
	
	.order-info {
		background-color: #fff;
		border-radius: 15rpx;
		padding: 20rpx 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		
		.info-item {
			display: flex;
			justify-content: space-between;
			padding: 15rpx 0;
			font-size: 28rpx;
			color: #333;
			
			.label {
				color: #666;
			}
			
			.value {
				&.price {
					color: #fa436a;
					font-weight: bold;
				}
			}
		}
	}
	
	.submit-btn {
		width: 90%;
		height: 80rpx;
		background: linear-gradient(to right, #ff3456, #ff347d);
		color: #fff;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 32rpx;
		margin: 50rpx auto;
		box-shadow: 0 10rpx 20rpx rgba(255, 52, 86, 0.2);
		font-weight: bold;
	}
</style> 