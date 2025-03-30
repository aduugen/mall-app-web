<template>
	<view class="content">
		<view class="invoice-card">
			<view class="card-header">
				<view class="invoice-status" :class="['status-' + invoice.status]">
					{{ statusText }}
				</view>
			</view>
			
			<view class="card-body">
				<view class="info-item">
					<view class="label">订单编号</view>
					<view class="value">{{ invoice.orderSn }}</view>
				</view>
				<view class="info-item">
					<view class="label">申请时间</view>
					<view class="value">{{ formatDate(invoice.applyTime) }}</view>
				</view>
				<view class="info-item">
					<view class="label">发票类型</view>
					<view class="value">{{ invoice.invoiceType === 1 ? '电子发票' : '纸质发票' }}</view>
				</view>
				<view class="info-item">
					<view class="label">发票抬头</view>
					<view class="value">{{ invoice.invoiceTitle }}</view>
				</view>
				<view class="info-item" v-if="invoice.taxNumber">
					<view class="label">税号</view>
					<view class="value">{{ invoice.taxNumber }}</view>
				</view>
				<view class="info-item">
					<view class="label">发票内容</view>
					<view class="value">{{ invoice.invoiceContent }}</view>
				</view>
				<view class="info-item">
					<view class="label">发票金额</view>
					<view class="value price">¥{{ invoice.invoiceAmount }}</view>
				</view>
				
				<!-- 电子发票信息 -->
				<view v-if="invoice.invoiceType === 1">
					<view class="section-title">收票信息</view>
					<view class="info-item">
						<view class="label">收票邮箱</view>
						<view class="value">{{ invoice.receiverEmail }}</view>
					</view>
					
					<view v-if="invoice.status === 1 && invoice.invoiceUrl" class="action-btn" @click="downloadInvoice">
						下载发票
					</view>
				</view>
				
				<!-- 纸质发票信息 -->
				<view v-if="invoice.invoiceType === 2">
					<view class="section-title">收件信息</view>
					<view class="info-item">
						<view class="label">收件人</view>
						<view class="value">{{ invoice.receiverName }}</view>
					</view>
					<view class="info-item">
						<view class="label">联系电话</view>
						<view class="value">{{ invoice.receiverPhone }}</view>
					</view>
					<view class="info-item">
						<view class="label">收件地址</view>
						<view class="value">{{ invoice.receiverAddress }}</view>
					</view>
					
					<view v-if="invoice.status === 1 && invoice.deliveryCompany" class="info-item">
						<view class="label">物流公司</view>
						<view class="value">{{ invoice.deliveryCompany }}</view>
					</view>
					<view v-if="invoice.status === 1 && invoice.deliverySn" class="info-item">
						<view class="label">物流单号</view>
						<view class="value">{{ invoice.deliverySn }}</view>
					</view>
					
					<view v-if="invoice.status === 1 && invoice.deliverySn" class="action-btn" @click="trackDelivery">
						查看物流
					</view>
				</view>
				
				<!-- 失败原因 -->
				<view v-if="invoice.status === 2 && invoice.reason" class="error-box">
					<view class="error-title">失败原因</view>
					<view class="error-content">{{ invoice.reason }}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { fetchInvoiceDetail } from '@/api/order.js';

	export default {
		data() {
			return {
				id: null,
				invoice: {
					id: '',
					orderId: '',
					orderSn: '',
					memberId: '',
					invoiceType: 1,
					titleType: 1,
					invoiceTitle: '',
					taxNumber: '',
					invoiceContent: '',
					invoiceAmount: 0,
					receiverEmail: '',
					receiverName: '',
					receiverPhone: '',
					receiverAddress: '',
					applyTime: '',
					issueTime: '',
					invoiceNumber: '',
					invoiceCode: '',
					invoiceUrl: '',
					status: 0,
					reason: '',
					deliveryCompany: '',
					deliverySn: '',
					note: '',
					createTime: '',
					updateTime: ''
				}
			}
		},
		computed: {
			statusText() {
				switch(this.invoice.status) {
					case 0: return '待开票';
					case 1: return '已开票';
					case 2: return '开票失败';
					default: return '未知状态';
				}
			}
		},
		onLoad(options) {
			if (options.id) {
				this.id = options.id;
				this.getInvoiceDetail();
			}
		},
		methods: {
			// 格式化时间
			formatDate(dateStr) {
				if (!dateStr) return '';
				const date = new Date(dateStr);
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hours = String(date.getHours()).padStart(2, '0');
				const minutes = String(date.getMinutes()).padStart(2, '0');
				const seconds = String(date.getSeconds()).padStart(2, '0');
				return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
			},
			
			// 获取发票详情
			getInvoiceDetail() {
				uni.showLoading({
					title: '加载中'
				});
				
				fetchInvoiceDetail(this.id)
					.then(res => {
						console.log('获取发票详情响应:', res);
						if (res && res.code === 200) {
							this.invoice = res.data;
						} else {
							uni.showToast({
								title: res.message || '获取发票详情失败',
								icon: 'none'
							});
						}
						uni.hideLoading();
					})
					.catch(err => {
						console.error('获取发票详情错误:', err);
						uni.showToast({
							title: '获取发票详情失败',
							icon: 'none'
						});
						uni.hideLoading();
					});
			},
			
			// 下载发票
			downloadInvoice() {
				if (!this.invoice.invoiceUrl) {
					this.$api.msg('发票尚未生成');
					return;
				}
				
				uni.showLoading({
					title: '下载中'
				});
				
				uni.downloadFile({
					url: this.invoice.invoiceUrl,
					success: (res) => {
						if (res.statusCode === 200) {
							uni.hideLoading();
							// 保存文件
							uni.saveFile({
								tempFilePath: res.tempFilePath,
								success: (saveRes) => {
									uni.showToast({
										title: '下载成功',
										icon: 'success'
									});
									
									// 打开文件
									uni.openDocument({
										filePath: saveRes.savedFilePath,
										success: () => {
											console.log('打开文件成功');
										},
										fail: (err) => {
											console.error('打开文件失败', err);
										}
									});
								},
								fail: (err) => {
									console.error('保存文件失败', err);
									uni.showToast({
										title: '保存文件失败',
										icon: 'none'
									});
								}
							});
						} else {
							uni.hideLoading();
							uni.showToast({
								title: '下载失败',
								icon: 'none'
							});
						}
					},
					fail: (err) => {
						console.error('下载失败', err);
						uni.hideLoading();
						uni.showToast({
							title: '下载失败',
							icon: 'none'
						});
					}
				});
			},
			
			// 查看物流
			trackDelivery() {
				if (!this.invoice.deliverySn) {
					this.$api.msg('暂无物流信息');
					return;
				}
				
				// 跳转到物流查询页面
				uni.navigateTo({
					url: `/pages/order/expressDetail?expressNo=${this.invoice.deliverySn}&expressName=${this.invoice.deliveryCompany}`
				});
			}
		}
	}
</script>

<style lang="scss">
	.content {
		background-color: #f8f8f8;
		min-height: 100vh;
		padding: 20rpx;
	}
	
	.invoice-card {
		background: #fff;
		border-radius: 15rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.05);
		
		.card-header {
			position: relative;
			height: 160rpx;
			background: linear-gradient(to right, #ff3456, #ff347d);
			padding: 30rpx;
			
			.invoice-status {
				position: absolute;
				top: 30rpx;
				right: 30rpx;
				padding: 10rpx 20rpx;
				border-radius: 30rpx;
				font-size: 24rpx;
				color: #fff;
				
				&.status-0 {
					background-color: rgba(144, 147, 153, 0.8);
				}
				
				&.status-1 {
					background-color: rgba(103, 194, 58, 0.8);
				}
				
				&.status-2 {
					background-color: rgba(245, 108, 108, 0.8);
				}
			}
		}
		
		.card-body {
			padding: 30rpx;
			
			.section-title {
				font-size: 28rpx;
				font-weight: bold;
				color: #303133;
				margin: 30rpx 0 15rpx;
				border-left: 4rpx solid #fa436a;
				padding-left: 15rpx;
			}
			
			.info-item {
				display: flex;
				margin-bottom: 20rpx;
				
				.label {
					width: 160rpx;
					font-size: 26rpx;
					color: #909399;
				}
				
				.value {
					flex: 1;
					font-size: 26rpx;
					color: #303133;
					word-break: break-all;
					
					&.price {
						font-weight: bold;
						color: #fa436a;
					}
				}
			}
			
			.error-box {
				margin-top: 30rpx;
				background-color: #fff0f0;
				padding: 20rpx;
				border-radius: 8rpx;
				
				.error-title {
					font-size: 26rpx;
					color: #f56c6c;
					margin-bottom: 10rpx;
					font-weight: bold;
				}
				
				.error-content {
					font-size: 26rpx;
					color: #f56c6c;
					line-height: 1.5;
				}
			}
			
			.action-btn {
				margin-top: 30rpx;
				height: 80rpx;
				background: linear-gradient(to right, #ff3456, #ff347d);
				color: #fff;
				border-radius: 40rpx;
				display: flex;
				justify-content: center;
				align-items: center;
				font-size: 28rpx;
				box-shadow: 0 10rpx 20rpx rgba(255, 52, 86, 0.2);
			}
		}
	}
</style> 