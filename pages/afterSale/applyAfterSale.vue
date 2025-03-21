<template>
	<view class="content">
		<view class="order-section">
			<view class="section-title">选择退货商品</view>
			<view class="goods-list">
				<view class="goods-item" v-for="(item, index) in orderInfo.orderItemList" :key="index">
					<checkbox :checked="selectedItems.includes(item.id)" @tap="toggleSelect(item.id)" color="#fa436a"/>
					<image class="goods-img" :src="item.productPic" mode="aspectFill"></image>
					<view class="goods-info">
						<text class="goods-name">{{item.productName}}</text>
						<text class="goods-attr">{{item.productAttr | formatProductAttr}}</text>
						<view class="goods-price">
							<text class="price">￥{{item.productPrice}}</text>
							<text class="quantity">x {{item.productQuantity}}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<view class="reason-section">
			<view class="section-title">退货原因</view>
			<view class="reason-list">
				<view class="reason-item" 
					v-for="(reason, index) in reasonList" 
					:key="index"
					:class="{active: selectedReason === reason}"
					@tap="selectReason(reason)">
					{{reason}}
				</view>
			</view>
			<view class="custom-reason" v-if="selectedReason === '其他原因'">
				<textarea class="reason-input" 
					v-model="customReason" 
					placeholder="请输入具体原因"
					maxlength="200">
				</textarea>
			</view>
		</view>
		
		<view class="upload-section">
			<view class="section-title">上传凭证</view>
			<view class="upload-list">
				<view class="upload-item" v-for="(item, index) in uploadList" :key="index">
					<image :src="item" mode="aspectFill"></image>
					<text class="delete-btn yticon icon-shanchu4" @click="deleteImage(index)"></text>
				</view>
				<view class="upload-btn" @click="chooseImage" v-if="uploadList.length < 9">
					<text class="yticon icon-jia1"></text>
				</view>
			</view>
		</view>
		
		<view class="submit-section">
			<button class="submit-btn" @click="submitAfterSale">提交申请</button>
		</view>
	</view>
</template>

<script>
import { fetchOrderDetail } from '@/api/order.js';
import { createAfterSale } from '@/api/afterSale.js';
import { API_BASE_URL } from '@/utils/appConfig.js';

export default {
	data() {
		return {
			orderId: null,
			orderInfo: {},
			selectedItems: [],
			selectedReason: '',
			customReason: '',
			uploadList: [],
			reasonList: [
				'商品质量问题',
				'商品与描述不符',
				'商品损坏',
				'商品尺寸不合适',
				'商品颜色不喜欢',
				'其他原因'
			]
		}
	},
	onLoad(options) {
		if(options.orderId) {
			this.orderId = options.orderId;
			this.getOrderDetail();
		}
	},
	methods: {
		getOrderDetail() {
			fetchOrderDetail(this.orderId).then(response => {
				this.orderInfo = response.data;
			});
		},
		toggleSelect(itemId) {
			const index = this.selectedItems.indexOf(itemId);
			if(index > -1) {
				this.selectedItems.splice(index, 1);
			} else {
				this.selectedItems.push(itemId);
			}
		},
		selectReason(reason) {
			this.selectedReason = reason;
			if(reason !== '其他原因') {
				this.customReason = '';
			}
		},
		chooseImage() {
			uni.chooseImage({
				count: 9 - this.uploadList.length,
				success: (res) => {
					this.uploadList = this.uploadList.concat(res.tempFilePaths);
				}
			});
		},
		deleteImage(index) {
			this.uploadList.splice(index, 1);
		},
		submitAfterSale() {
			if(this.selectedItems.length === 0) {
				uni.showToast({
					title: '请选择要退货的商品',
					icon: 'none'
				});
				return;
			}
			
			if(!this.selectedReason) {
				uni.showToast({
					title: '请选择退货原因',
					icon: 'none'
				});
				return;
			}
			
			if(this.selectedReason === '其他原因' && !this.customReason.trim()) {
				uni.showToast({
					title: '请输入具体原因',
					icon: 'none'
				});
				return;
			}
			
			// 先上传图片，再提交售后申请
			if(this.uploadList.length > 0) {
				uni.showLoading({
					title: '正在上传图片...'
				});
				
				let uploadedImages = [];
				let uploadPromises = [];
				
				this.uploadList.forEach((imagePath, index) => {
					console.log('开始上传图片', index, imagePath);
					let uploadPromise = new Promise((resolve, reject) => {
						uni.uploadFile({
							url: API_BASE_URL + '/upload/image',
							filePath: imagePath,
							name: 'file',
							header: {
								'Authorization': uni.getStorageSync('token')
							},
							success: (res) => {
								console.log('图片上传成功', res);
								try {
									// 对返回数据进行处理
									let responseData;
									if (typeof res.data === 'string') {
										responseData = JSON.parse(res.data);
									} else {
										responseData = res.data;
									}
									
									if(responseData.code === 200) {
										uploadedImages.push(responseData.data);
										resolve();
									} else {
										reject(responseData.message || '图片上传失败');
									}
								} catch(e) {
									console.error('解析上传结果失败', e);
									reject('图片上传异常: ' + e.message);
								}
							},
							fail: (err) => {
								console.error('图片上传失败', err);
								reject(err.errMsg || '图片上传网络错误');
							}
						});
					});
					
					uploadPromises.push(uploadPromise);
				});
				
				Promise.all(uploadPromises).then(() => {
					uni.hideLoading();
					console.log('所有图片上传完成', uploadedImages);
					this.submitAfterSaleWithImages(uploadedImages);
				}).catch(err => {
					uni.hideLoading();
					console.error('图片上传异常', err);
					uni.showToast({
						title: err || '图片上传失败',
						icon: 'none'
					});
				});
			} else {
				this.submitAfterSaleWithImages([]);
			}
		},
		
		submitAfterSaleWithImages(imageUrls) {
			uni.showLoading({
				title: '提交申请...'
			});
			
			const afterSaleData = {
				orderId: this.orderId,
				orderItemIds: this.selectedItems.join(','), // 将数组转为逗号分隔的字符串
				reason: this.selectedReason === '其他原因' ? this.customReason : this.selectedReason,
				pics: imageUrls.length > 0 ? imageUrls.join(',') : null // 将数组转为逗号分隔的字符串
			};
			
			console.log('提交售后申请数据', afterSaleData);
			
			createAfterSale(afterSaleData).then(response => {
				uni.hideLoading();
				if(response.code === 200) {
					uni.showToast({
						title: '申请提交成功'
					});
					// 通知售后列表页面刷新数据
					uni.$emit('afterSaleListRefresh');
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				} else {
					uni.showToast({
						title: response.message || '申请提交失败',
						icon: 'none'
					});
				}
			}).catch(error => {
				console.error('提交售后申请失败', error);
				uni.hideLoading();
				uni.showToast({
					title: '申请提交失败，请重试',
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
	background: #f8f8f8;
	padding-bottom: 120rpx;
}

.section-title {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 20rpx;
	padding: 0 30rpx;
}

.order-section {
	background: #fff;
	padding: 30rpx 0;
	margin-bottom: 20rpx;
	
	.goods-list {
		.goods-item {
			display: flex;
			align-items: center;
			padding: 20rpx 30rpx;
			border-bottom: 1px solid #eee;
			
			&:last-child {
				border-bottom: none;
			}
			
			.goods-img {
				width: 120rpx;
				height: 120rpx;
				border-radius: 8rpx;
				margin: 0 20rpx;
			}
			
			.goods-info {
				flex: 1;
				
				.goods-name {
					font-size: 28rpx;
					color: #333;
					line-height: 1.4;
				}
				
				.goods-attr {
					font-size: 24rpx;
					color: #999;
					margin-top: 10rpx;
				}
				
				.goods-price {
					margin-top: 10rpx;
					display: flex;
					justify-content: space-between;
					align-items: center;
					
					.price {
						font-size: 28rpx;
						color: #fa436a;
					}
					
					.quantity {
						font-size: 24rpx;
						color: #999;
					}
				}
			}
		}
	}
}

.reason-section {
	background: #fff;
	padding: 30rpx 0;
	margin-bottom: 20rpx;
	
	.reason-list {
		padding: 0 30rpx;
		
		.reason-item {
			height: 80rpx;
			line-height: 80rpx;
			font-size: 28rpx;
			color: #333;
			border-bottom: 1px solid #eee;
			
			&:last-child {
				border-bottom: none;
			}
			
			&.active {
				color: #fa436a;
			}
		}
	}
	
	.custom-reason {
		padding: 20rpx 30rpx;
		
		.reason-input {
			width: 100%;
			height: 200rpx;
			background: #f8f8f8;
			padding: 20rpx;
			font-size: 28rpx;
			color: #333;
		}
	}
}

.upload-section {
	background: #fff;
	padding: 30rpx 0;
	
	.upload-list {
		padding: 0 30rpx;
		display: flex;
		flex-wrap: wrap;
		
		.upload-item {
			width: 200rpx;
			height: 200rpx;
			margin-right: 20rpx;
			margin-bottom: 20rpx;
			position: relative;
			
			image {
				width: 100%;
				height: 100%;
				border-radius: 8rpx;
			}
			
			.delete-btn {
				position: absolute;
				right: -10rpx;
				top: -10rpx;
				width: 40rpx;
				height: 40rpx;
				background: rgba(0,0,0,0.5);
				border-radius: 50%;
				color: #fff;
				font-size: 24rpx;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		}
		
		.upload-btn {
			width: 200rpx;
			height: 200rpx;
			background: #f8f8f8;
			border-radius: 8rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			
			.yticon {
				font-size: 60rpx;
				color: #999;
			}
		}
	}
}

.submit-section {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 20rpx 30rpx;
	background: #fff;
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
	
	.submit-btn {
		width: 100%;
		height: 80rpx;
		background: #fa436a;
		color: #fff;
		font-size: 32rpx;
		border-radius: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
</style> 