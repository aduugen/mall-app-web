<template>
	<view class="content">
		<view class="evaluation-section">
			<view class="product-info">
				<image class="product-img" :src="productInfo.productPic" mode="aspectFill"></image>
				<view class="product-detail">
					<text class="product-name">{{productInfo.productName}}</text>
					<text class="product-attr">{{productInfo.productAttr | formatProductAttr}}</text>
				</view>
			</view>
			
			<view class="rating-section">
				<text class="section-title">商品评分</text>
				<view class="rating-stars">
					<text class="yticon" 
						v-for="(star, index) in 5" 
						:key="index"
						:class="index < rating ? 'icon-xingxing' : 'icon-xingxing'"
						:style="{color: index < rating ? '#fa436a' : '#ddd'}"
						@click="setRating(index + 1)">
					</text>
				</view>
			</view>
			
			<view class="comment-section">
				<text class="section-title">评价内容</text>
				<textarea class="comment-input" 
					v-model="comment" 
					placeholder="请输入您的评价内容"
					maxlength="500">
				</textarea>
			</view>
			
			<view class="upload-section">
				<text class="section-title">上传图片</text>
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
		</view>
		
		<view class="submit-section">
			<button class="submit-btn" @click="submitEvaluation">提交评价</button>
		</view>
	</view>
</template>

<script>
import { fetchProductDetail } from '@/api/product.js';
import { createProductComment } from '@/api/order.js';
import { API_BASE_URL } from '@/utils/appConfig.js';

export default {
	data() {
		return {
			orderId: null,
			productId: null,
			productInfo: {},
			rating: 5,
			comment: '',
			uploadList: []
		}
	},
	onLoad(options) {
		if(options.orderId && options.productId) {
			this.orderId = options.orderId;
			this.productId = options.productId;
			this.getProductDetail();
		}
	},
	methods: {
		getProductDetail() {
			fetchProductDetail(this.productId).then(response => {
				this.productInfo = response.data;
			});
		},
		setRating(value) {
			this.rating = value;
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
		submitEvaluation() {
			if(!this.comment.trim()) {
				uni.showToast({
					title: '请输入评价内容',
					icon: 'none'
				});
				return;
			}
			
			// 先上传图片，再提交评价
			if(this.uploadList.length > 0) {
				uni.showLoading({
					title: '正在上传图片...'
				});
				
				let uploadedImages = [];
				let uploadPromises = [];
				
				// 遍历所有需要上传的图片
				this.uploadList.forEach(imagePath => {
					// 创建上传Promise
					let uploadPromise = new Promise((resolve, reject) => {
						uni.uploadFile({
							url: API_BASE_URL + '/upload/image', // 后端图片上传接口
							filePath: imagePath,
							name: 'file',
							header: {
								'Authorization': uni.getStorageSync('token')
							},
							success: (res) => {
								try {
									// 解析结果，获取图片URL
									let data = JSON.parse(res.data);
									if(data.code === 200) {
										uploadedImages.push(data.data);
										resolve();
									} else {
										reject(data.message || '图片上传失败');
									}
								} catch(e) {
									reject('图片上传异常');
								}
							},
							fail: (err) => {
								reject(err.errMsg || '图片上传网络错误');
							}
						});
					});
					
					uploadPromises.push(uploadPromise);
				});
				
				// 所有图片上传完成后，提交评价内容
				Promise.all(uploadPromises).then(() => {
					uni.hideLoading();
					this.submitCommentWithImages(uploadedImages);
				}).catch(err => {
					uni.hideLoading();
					uni.showToast({
						title: err || '图片上传失败',
						icon: 'none'
					});
				});
			} else {
				// 没有图片，直接提交评价
				this.submitCommentWithImages([]);
			}
		},
		
		// 提交评价内容
		submitCommentWithImages(imageUrls) {
			uni.showLoading({
				title: '提交评价...'
			});
			
			createProductComment({
				orderId: this.orderId,
				productId: this.productId,
				rating: this.rating,
				comment: this.comment,
				pics: imageUrls
			}).then(response => {
				uni.hideLoading();
				if(response.code === 200) {
					uni.showToast({
						title: '评价成功'
					});
					// 通知订单列表页面刷新数据
					uni.$emit('orderListRefresh');
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				} else {
					uni.showToast({
						title: response.message || '评价失败',
						icon: 'none'
					});
				}
			}).catch(() => {
				uni.hideLoading();
				uni.showToast({
					title: '评价失败，请重试',
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

.evaluation-section {
	background: #fff;
	padding: 30rpx;
	margin-bottom: 20rpx;
	
	.product-info {
		display: flex;
		padding-bottom: 30rpx;
		border-bottom: 1px solid #eee;
		
		.product-img {
			width: 160rpx;
			height: 160rpx;
			border-radius: 8rpx;
		}
		
		.product-detail {
			flex: 1;
			padding-left: 20rpx;
			
			.product-name {
				font-size: 28rpx;
				color: #333;
				line-height: 1.4;
			}
			
			.product-attr {
				font-size: 24rpx;
				color: #999;
				margin-top: 10rpx;
			}
		}
	}
	
	.section-title {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 20rpx;
		display: block;
	}
	
	.rating-section {
		padding: 30rpx 0;
		border-bottom: 1px solid #eee;
		
		.rating-stars {
			display: flex;
			align-items: center;
			
			.yticon {
				font-size: 40rpx;
				margin-right: 10rpx;
			}
		}
	}
	
	.comment-section {
		padding: 30rpx 0;
		border-bottom: 1px solid #eee;
		
		.comment-input {
			width: 100%;
			height: 200rpx;
			background: #f8f8f8;
			padding: 20rpx;
			font-size: 28rpx;
			color: #333;
		}
	}
	
	.upload-section {
		padding: 30rpx 0;
		
		.upload-list {
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