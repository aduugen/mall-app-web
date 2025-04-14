<template>
	<view class="content">
		<view v-if="!afterSaleDetail || loadError" class="error-container">
			<view class="error-icon">
				<text class="yticon icon-jujue"></text>
			</view>
			<text class="error-text">{{errorMessage || '获取售后详情失败，请稍后重试'}}</text>
			<button class="retry-btn" @click="retryLoading">重新加载</button>
		</view>
		
		<template v-else>
			<view class="status-section" v-if="afterSaleDetail">
				<view class="status-icon" :class="statusIconClass">
					<text class="yticon" :class="statusIcon"></text>
				</view>
				<view class="status-info">
					<text class="status-text">{{statusText}}</text>
					<text class="status-desc">{{statusDesc}}</text>
				</view>
			</view>
			
			<!-- 进度详情 -->
			<view class="progress-section" v-if="afterSaleDetail">
				<view class="section-title">进度详情</view>
				<view class="progress-timeline">
					<view class="timeline-item" :class="{'active': afterSaleDetail.createTime}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">售后申请提交</text>
							<text class="timeline-time" v-if="afterSaleDetail.createTime">{{formatDate(afterSaleDetail.createTime)}}</text>
						</view>
					</view>
					<view class="timeline-item" :class="{'active': afterSaleDetail.status >= 1}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">商家处理中</text>
							<text class="timeline-time" v-if="afterSaleDetail.status >= 1">{{getStatusChangeTime(1)}}</text>
						</view>
					</view>
					<view class="timeline-item" :class="{'active': afterSaleDetail.status === 2 || afterSaleDetail.status === 3}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">{{afterSaleDetail.status === 3 ? '申请被拒绝' : '申请完成'}}</text>
							<text class="timeline-time" v-if="afterSaleDetail.handleTime">{{formatDate(afterSaleDetail.handleTime)}}</text>
						</view>
					</view>
					<view class="timeline-item" :class="{'active': afterSaleDetail.status === 2}">
						<view class="timeline-icon"></view>
						<view class="timeline-content">
							<text class="timeline-title">退款完成</text>
							<text class="timeline-time" v-if="afterSaleDetail.status === 2">{{formatDate(afterSaleDetail.handleTime)}}</text>
						</view>
					</view>
				</view>
			</view>
			
			<view class="detail-section" v-if="afterSaleDetail">
				<view class="section-title">售后信息</view>
				<view class="detail-item">
					<text class="item-label">售后编号</text>
					<text class="item-value">{{afterSaleDetail.id}}</text>
				</view>
				<!-- 添加订单号显示 -->
				<view class="detail-item">
					<text class="item-label">订单号</text>
					<text class="item-value">{{afterSaleDetail.orderId}}</text>
				</view>
				<!-- 添加订单SN显示 -->
				<view class="detail-item" v-if="orderInfo && orderInfo.orderSn">
					<text class="item-label">订单SN</text>
					<text class="item-value">{{orderInfo.orderSn}}</text>
				</view>
				<view class="detail-item">
					<text class="item-label">创建时间</text>
					<text class="item-value">{{formatDate(afterSaleDetail.createTime)}}</text>
				</view>
				<view class="detail-item">
					<text class="item-label">售后原因</text>
					<text class="item-value">{{afterSaleDetail.reason}}</text>
				</view>
				<!-- 添加退款总金额显示 -->
				<view class="detail-item highlight">
					<text class="item-label">退款总金额</text>
					<text class="item-value amount">￥{{calculateTotalRefund()}}</text>
				</view>
				<view class="detail-item" v-if="afterSaleDetail.handleNote">
					<text class="item-label">处理备注</text>
					<text class="item-value">{{afterSaleDetail.handleNote}}</text>
				</view>
				<view class="detail-item" v-if="afterSaleDetail.handleTime">
					<text class="item-label">处理时间</text>
					<text class="item-value">{{formatDate(afterSaleDetail.handleTime)}}</text>
				</view>
				<!-- 添加联系人/联系方式 -->
				<view class="detail-item" v-if="orderInfo && orderInfo.receiverName">
					<text class="item-label">联系人</text>
					<text class="item-value">{{orderInfo.receiverName}}</text>
				</view>
				<view class="detail-item" v-if="orderInfo && orderInfo.receiverPhone">
					<text class="item-label">联系方式</text>
					<text class="item-value">{{orderInfo.receiverPhone}}</text>
				</view>
			</view>
			
			<view class="pics-section" v-if="afterSaleDetail && afterSaleDetail.pics">
				<view class="section-title">退货凭证</view>
				<scroll-view class="pics-scroll" scroll-x="true" show-scrollbar="false">
					<view class="pics-container">
						<view class="pic-item" v-for="(pic, picIndex) in formatPics(afterSaleDetail.pics)" :key="picIndex" @click="previewImage(pic, formatPics(afterSaleDetail.pics))">
							<image class="thumbnail" :src="pic" mode="aspectFill"></image>
						</view>
					</view>
				</scroll-view>
			</view>
			
			<view class="goods-section" v-if="afterSaleDetail && afterSaleDetail.afterSaleItemList">
				<view class="section-title">退货商品</view>
				<view class="goods-item" v-for="(item, index) in afterSaleDetail.afterSaleItemList" :key="index">
					<image class="goods-img" :src="item.productPic" mode="aspectFill"></image>
					<view class="goods-info">
						<text class="goods-name">{{item.productName}}</text>
						<text class="goods-attr">{{item.productAttr | formatProductAttr}}</text>
						<view class="goods-price">
							<text class="price">￥{{item.productPrice}}</text>
						</view>
						<view class="return-quantity">
							<text class="quantity-label">购买数量:</text>
							<text class="quantity-value">{{item.productQuantity}}</text>
							<text class="quantity-label return">退货数量:</text>
							<text class="quantity-value return">{{item.returnQuantity}}</text>
						</view>
						<view class="item-reason" v-if="item.reason">
							<text class="reason-label">退货原因:</text>
							<text class="reason-value">{{item.reason}}</text>
						</view>
						<view class="item-pics" v-if="item.pics">
							<text class="pics-label">凭证图片:</text>
							<scroll-view class="pics-scroll" scroll-x="true" show-scrollbar="false">
								<view class="pics-container">
									<view class="pic-item" v-for="(pic, picIndex) in formatPics(item.pics)" :key="picIndex" @click="previewImage(pic, formatPics(item.pics))">
										<image class="thumbnail" :src="pic" mode="aspectFill"></image>
									</view>
								</view>
							</scroll-view>
						</view>
					</view>
				</view>
			</view>
		</template>
	</view>
</template>

<script>
import {fetchAfterSaleDetail, cancelAfterSale} from '@/api/afterSale.js';
import {getOrderDetail} from '@/api/order.js';
import {formatDate} from '@/utils/date';
import {API_BASE_URL} from '@/utils/appConfig.js';

export default {
	data() {
		return {
			afterSaleId: null,
			afterSaleDetail: null,
			orderInfo: null,
			statusChangeTimes: {}, // 存储各状态的时间记录
			loadError: false,
			errorMessage: ''
		}
	},
	computed: {
		statusText() {
			if(!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 0: return '待处理';
				case 1: return '处理中';
				case 2: return '已完成';
				case 3: return '已拒绝';
				default: return '未知状态';
			}
		},
		statusDesc() {
			if(!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 0: return '您的售后申请已提交，等待商家处理';
				case 1: return '商家正在处理您的售后申请';
				case 2: return '售后申请已处理完成';
				case 3: return '很抱歉，您的售后申请被拒绝';
				default: return '';
			}
		},
		statusIcon() {
			if(!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 0: return 'icon-daifukuan';
				case 1: return 'icon-shouhou';
				case 2: return 'icon-yiwancheng';
				case 3: return 'icon-jujue';
				default: return 'icon-help';
			}
		},
		statusIconClass() {
			if(!this.afterSaleDetail) return '';
			
			const status = this.afterSaleDetail.status;
			switch(status) {
				case 0: return 'wait';
				case 1: return 'process';
				case 2: return 'success';
				case 3: return 'reject';
				default: return '';
			}
		}
	},
	onLoad(options) {
		if(options.id) {
			this.afterSaleId = options.id;
			this.getAfterSaleDetail();
		}
	},
	filters: {
		formatProductAttr(attrStr) {
			if(!attrStr) return '';
			
			try {
				let attrArr = JSON.parse(attrStr);
				let result = [];
				for(let item of attrArr) {
					result.push(item.key + ':' + item.value);
				}
				return result.join(' ');
			} catch(e) {
				return attrStr;
			}
		}
	},
	methods: {
		formatDate,
		getAfterSaleDetail() {
			console.log('开始获取售后详情，ID:', this.afterSaleId);
			
			// 添加加载状态提示
			uni.showLoading({
				title: '加载中...'
			});
			
			// 重置错误状态
			this.loadError = false;
			this.errorMessage = '';
			
			fetchAfterSaleDetail({id: this.afterSaleId}).then(response => {
				uni.hideLoading();
				console.log('售后详情返回数据:', JSON.stringify(response));
				
				if(response.code === 200) {
					this.afterSaleDetail = response.data;
					console.log('售后详情数据:', JSON.stringify(this.afterSaleDetail));
					
					// 检查返回的数据是否有效
					if (!this.afterSaleDetail || typeof this.afterSaleDetail !== 'object') {
						console.error('售后详情数据无效');
						this.loadError = true;
						this.errorMessage = '售后详情数据无效或已被删除';
						return;
					}
					
					// 获取订单详情
					if(this.afterSaleDetail.orderId) {
						this.getOrderDetail(this.afterSaleDetail.orderId);
					} else {
						console.error('售后详情中没有订单ID');
					}
				} else {
					console.error('获取售后详情失败:', response.message);
					this.loadError = true;
					this.errorMessage = response.message || '获取售后详情失败';
					uni.showToast({
						title: response.message || '获取售后详情失败',
						icon: 'none',
						duration: 2000
					});
				}
			}).catch(error => {
				uni.hideLoading();
				console.error('获取售后详情异常:', error);
				this.loadError = true;
				this.errorMessage = error.message || '获取售后详情异常';
				uni.showToast({
					title: '获取售后详情异常:' + (error.message || '未知错误'),
					icon: 'none',
					duration: 2000
				});
			});
		},
		// 获取订单详情
		getOrderDetail(orderId) {
			console.log('开始获取订单详情，订单ID:', orderId);
			
			getOrderDetail(orderId).then(response => {
				console.log('订单详情返回数据:', JSON.stringify(response));
				
				if(response.code === 200) {
					this.orderInfo = response.data;
					console.log('订单详情数据:', JSON.stringify(this.orderInfo));
				} else {
					console.error('获取订单详情失败:', response.message);
				}
			}).catch(error => {
				console.error('获取订单详情异常:', error);
			});
		},
		// 计算总退款金额
		calculateTotalRefund() {
			if(!this.afterSaleDetail || !this.afterSaleDetail.afterSaleItemList) {
				return '0.00';
			}
			
			let total = 0;
			this.afterSaleDetail.afterSaleItemList.forEach(item => {
				const itemTotal = (item.productRealPrice || 0) * (item.returnQuantity || 0);
				total += itemTotal;
			});
			
			return total.toFixed(2);
		},
		// 获取状态变更时间
		getStatusChangeTime(status) {
			if(this.statusChangeTimes[status]) {
				return this.formatDate(this.statusChangeTimes[status]);
			}
			
			// 如果没有记录状态变更时间，对于已处理的状态返回处理时间
			if(status === 1 && this.afterSaleDetail && this.afterSaleDetail.status >= 1) {
				// 对于处理中状态，如果没有记录，使用创建时间后1天作为估计
				if (this.afterSaleDetail.createTime) {
					try {
						let createTime = this.afterSaleDetail.createTime;
						// 确保createTime是日期对象
						if (typeof createTime === 'string') {
							createTime = new Date(createTime);
						}
						
						// 检查是否是有效的日期对象
						if (createTime instanceof Date && !isNaN(createTime.getTime())) {
							const estimatedTime = new Date(createTime);
							estimatedTime.setDate(estimatedTime.getDate() + 1);
							return this.formatDate(estimatedTime);
						}
					} catch (e) {
						console.error('处理状态变更时间出错:', e);
					}
				}
			}
			
			return '';
		},
		cancelAfterSale() {
			uni.showModal({
				title: '提示',
				content: '确定要取消此售后申请吗？\n取消后记录将被删除',
				success: (res) => {
					if(res.confirm) {
						uni.showLoading({
							title: '处理中...'
						});
						
						cancelAfterSale({id: this.afterSaleId}).then(response => {
							uni.hideLoading();
							
							if(response.code === 200) {
								uni.showToast({
									title: '售后申请已取消',
									icon: 'success'
								});
								// 通知售后列表刷新
								uni.$emit('afterSaleListRefresh');
								setTimeout(() => {
									uni.navigateBack();
								}, 1500);
							} else {
								uni.showToast({
									title: response.message || '取消失败，请重试',
									icon: 'none'
								});
							}
						}).catch(error => {
							uni.hideLoading();
							console.error('取消售后申请失败:', error);
							uni.showToast({
								title: '取消失败: ' + (error.message || '未知错误'),
								icon: 'none'
							});
						});
					}
				}
			});
		},
		formatPics(picsStr) {
			if (!picsStr) return [];
			
			// 处理字符串类型
			if (typeof picsStr === 'string') {
				// 直接处理逗号分隔的图片地址
				if (picsStr.includes(',')) {
					const urls = picsStr.split(',')
						.map(url => url.trim())
						.filter(url => url)
						.map(url => this.fixImagePath(url));
					return urls;
				}
				
				// 单个URL
				return [this.fixImagePath(picsStr)];
			}
			
			return [];
		},
		fixImagePath(path) {
			if (!path) return '';
			
			// 已经是完整URL
			if (path.startsWith('http')) {
				return path;
			}
			
			// 相对路径，添加基础URL
			if (path.startsWith('/')) {
				return API_BASE_URL + path;
			}
			
			return API_BASE_URL + '/' + path;
		},
		previewImage(current, urls) {
			uni.previewImage({
				current: current,
				urls: urls
			});
		},
		// 重试加载方法
		retryLoading() {
			if (this.afterSaleId) {
				this.getAfterSaleDetail();
			} else {
				uni.showToast({
					title: '售后ID无效，请返回重试',
					icon: 'none'
				});
			}
		}
	}
}
</script>

<style lang="scss">
.content {
	padding-bottom: 30upx;
	
	// 错误容器样式
	.error-container {
		padding: 60upx 30upx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		
		.error-icon {
			width: 120upx;
			height: 120upx;
			border-radius: 50%;
			background-color: #f8f8f8;
			display: flex;
			justify-content: center;
			align-items: center;
			margin-bottom: 30upx;
			
			.yticon {
				font-size: 60upx;
				color: #d63031;
			}
		}
		
		.error-text {
			font-size: 28upx;
			color: #666;
			text-align: center;
			margin-bottom: 30upx;
		}
		
		.retry-btn {
			width: 300upx;
			height: 80upx;
			line-height: 80upx;
			background-color: #0066cc;
			color: #fff;
			border-radius: 40upx;
			font-size: 28upx;
		}
	}
	
	.status-section {
		background-color: #0066cc;
		color: #fff;
		padding: 50upx 30upx;
		display: flex;
		align-items: center;
		
		.status-icon {
			width: 100upx;
			height: 100upx;
			border-radius: 50%;
			background-color: rgba(255, 255, 255, 0.2);
			display: flex;
			justify-content: center;
			align-items: center;
			margin-right: 30upx;
			
			.yticon {
				font-size: 60upx;
				color: #fff;
			}
			
			&.wait {
				background-color: #fdcb6e;
			}
			
			&.process {
				background-color: #0066cc;
			}
			
			&.success {
				background-color: #00b894;
			}
			
			&.reject {
				background-color: #d63031;
			}
		}
		
		.status-info {
			flex: 1;
			
			.status-text {
				font-size: 36upx;
				font-weight: bold;
				margin-bottom: 10upx;
				display: block;
			}
			
			.status-desc {
				font-size: 26upx;
				opacity: 0.8;
			}
		}
	}
	
	/* 进度时间线样式 */
	.progress-section {
		background-color: #fff;
		margin-bottom: 20upx;
		
		.progress-timeline {
			padding: 30upx;
			
			.timeline-item {
				display: flex;
				position: relative;
				padding-bottom: 30upx;
				
				&:not(:last-child):before {
					content: '';
					position: absolute;
					left: 10upx;
					top: 30upx;
					height: calc(100% - 30upx);
					width: 2upx;
					background-color: #ddd;
				}
				
				.timeline-icon {
					width: 20upx;
					height: 20upx;
					border-radius: 50%;
					background-color: #ddd;
					margin-right: 20upx;
					margin-top: 10upx;
				}
				
				.timeline-content {
					flex: 1;
					
					.timeline-title {
						font-size: 28upx;
						color: #666;
						margin-bottom: 5upx;
						display: block;
					}
					
					.timeline-time {
						font-size: 24upx;
						color: #999;
					}
				}
				
				&.active {
					.timeline-icon {
						background-color: #0066cc;
						box-shadow: 0 0 0 4upx rgba(0, 102, 204, 0.2);
					}
					
					.timeline-title {
						color: #333;
						font-weight: bold;
					}
					
					.timeline-time {
						color: #0066cc;
					}
				}
			}
		}
	}
	
	.section-title {
		font-size: 32upx;
		color: #333;
		font-weight: bold;
		padding: 30upx;
		background-color: #f8f8f8;
	}
	
	.detail-section {
		background-color: #fff;
		margin-bottom: 20upx;
		
		.detail-item {
			display: flex;
			padding: 20upx 30upx;
			border-bottom: 1px solid #f5f5f5;
			
			.item-label {
				width: 180upx;
				color: #666;
				font-size: 28upx;
			}
			
			.item-value {
				flex: 1;
				color: #333;
				font-size: 28upx;
			}
			
			&.highlight {
				background-color: #f0f5ff;
				
				.item-label {
					font-weight: bold;
					color: #333;
				}
				
				.item-value.amount {
					color: #fa436a;
					font-weight: bold;
					font-size: 32upx;
				}
			}
		}
	}
	
	.pics-section {
		background-color: #fff;
		margin-bottom: 20upx;
		
		.pics-scroll {
			white-space: nowrap;
			padding: 20upx 30upx;
		}
		
		.pics-container {
			display: inline-flex;
		}
		
		.pic-item {
			margin-right: 20upx;
			
			.thumbnail {
				width: 160upx;
				height: 160upx;
				border-radius: 8upx;
			}
		}
	}
	
	.goods-section {
		background-color: #fff;
		margin-bottom: 20upx;
		
		.goods-item {
			display: flex;
			padding: 30upx;
			border-bottom: 1px solid #f5f5f5;
			
			.goods-img {
				width: 180upx;
				height: 180upx;
				border-radius: 8upx;
			}
			
			.goods-info {
				flex: 1;
				padding-left: 30upx;
				
				.goods-name {
					font-size: 28upx;
					color: #333;
					margin-bottom: 10upx;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					overflow: hidden;
				}
				
				.goods-attr {
					font-size: 24upx;
					color: #999;
					margin-bottom: 10upx;
				}
				
				.goods-price {
					font-size: 28upx;
					color: #fa436a;
					margin-bottom: 10upx;
				}
				
				.return-quantity {
					font-size: 24upx;
					color: #999;
					
					.quantity-label {
						margin-right: 10upx;
						
						&.return {
							margin-left: 30upx;
						}
					}
					
					.quantity-value {
						color: #333;
						
						&.return {
							color: #fa436a;
							font-weight: bold;
						}
					}
				}
				
				.item-reason {
					font-size: 24upx;
					color: #999;
					margin-top: 10upx;
					
					.reason-label {
						margin-right: 10upx;
					}
					
					.reason-value {
						color: #333;
					}
				}
				
				.item-pics {
					margin-top: 10upx;
					
					.pics-label {
						font-size: 24upx;
						color: #999;
						display: block;
						margin-bottom: 10upx;
					}
					
					.pics-scroll {
						width: 100%;
						white-space: nowrap;
					}
					
					.pics-container {
						display: inline-flex;
						padding: 5upx 0;
					}
					
					.pic-item {
						margin-right: 15upx;
						
						.thumbnail {
							width: 120upx;
							height: 120upx;
							border-radius: 8upx;
						}
					}
				}
			}
		}
	}
}
</style> 