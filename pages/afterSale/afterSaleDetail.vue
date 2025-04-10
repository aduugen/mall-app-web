<template>
	<view class="content">
		<view class="status-section" v-if="afterSaleDetail">
			<view class="status-icon" :class="statusIconClass">
				<text class="yticon" :class="statusIcon"></text>
			</view>
			<view class="status-info">
				<text class="status-text">{{statusText}}</text>
				<text class="status-desc">{{statusDesc}}</text>
			</view>
		</view>
		
		<view class="detail-section" v-if="afterSaleDetail">
			<view class="section-title">售后信息</view>
			<view class="detail-item">
				<text class="item-label">售后编号</text>
				<text class="item-value">{{afterSaleDetail.id}}</text>
			</view>
			<view class="detail-item">
				<text class="item-label">创建时间</text>
				<text class="item-value">{{formatDate(afterSaleDetail.createTime)}}</text>
			</view>
			<view class="detail-item">
				<text class="item-label">售后原因</text>
				<text class="item-value">{{afterSaleDetail.reason}}</text>
			</view>
			<view class="detail-item" v-if="afterSaleDetail.handleNote">
				<text class="item-label">处理备注</text>
				<text class="item-value">{{afterSaleDetail.handleNote}}</text>
			</view>
			<view class="detail-item" v-if="afterSaleDetail.handleTime">
				<text class="item-label">处理时间</text>
				<text class="item-value">{{formatDate(afterSaleDetail.handleTime)}}</text>
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
		
		<view class="btn-section" v-if="afterSaleDetail && afterSaleDetail.status === 0">
			<button class="cancel-btn" @click="cancelAfterSale">取消申请</button>
		</view>
	</view>
</template>

<script>
import {fetchAfterSaleDetail, cancelAfterSale} from '@/api/afterSale.js';
import {formatDate} from '@/utils/date';
import {API_BASE_URL} from '@/utils/appConfig.js';

export default {
	data() {
		return {
			afterSaleId: null,
			afterSaleDetail: null
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
			fetchAfterSaleDetail({id: this.afterSaleId}).then(response => {
				if(response.code === 200) {
					this.afterSaleDetail = response.data;
				} else {
					uni.showToast({
						title: response.message || '获取售后详情失败',
						icon: 'none'
					});
				}
			});
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
		}
	}
}
</script>

<style lang="scss">
.content {
	padding-bottom: 30upx;
	
	.status-section {
		background-color: #fa436a;
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
				background-color: #0984e3;
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
	
	.btn-section {
		padding: 40upx;
		display: flex;
		justify-content: center;
		
		.cancel-btn {
			background-color: #fff;
			color: #666;
			border: 1px solid #ddd;
			width: 60%;
			height: 80upx;
			line-height: 80upx;
			font-size: 32upx;
			border-radius: 40upx;
		}
	}
}
</style> 