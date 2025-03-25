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
					<text class="value">{{orderId}}</text>
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
	export default {
		data() {
			return {
				orderId: '',
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
				// 获取订单信息
				this.getOrderInfo();
			}
		},
		methods: {
			// 获取订单信息
			getOrderInfo() {
				// 这里应该调用获取订单详情的API
				// 示例代码
				uni.showLoading({
					title: '加载中'
				});
				
				// 模拟API调用
				setTimeout(() => {
					// 模拟数据，实际应该从API获取
					this.orderAmount = '299.00';
					uni.hideLoading();
				}, 500);
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
				
				// 模拟API调用
				setTimeout(() => {
					uni.hideLoading();
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
				}, 1000);
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
				}
			}
		}
	}
	
	.submit-btn {
		width: 90%;
		height: 80rpx;
		background-color: #fa436a;
		color: #fff;
		border-radius: 40rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 32rpx;
		margin: 50rpx auto;
	}
</style> 