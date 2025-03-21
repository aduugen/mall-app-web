<template>
	<view class="content">
		<view class="header">
			<view class="title">评价商品</view>
			<view class="sub-title">订单: {{orderId}}</view>
		</view>
		
		<!-- 商品列表 -->
		<view class="products-section">
			<view class="product-item" v-for="(item, index) in productList" :key="item.productId">
				<view class="product-header">
					<view class="checkbox" @click="toggleProduct(item)">
						<text class="yticon" :class="{'icon-xuanzhong2': item.selected, 'icon-yuan': !item.selected}"></text>
					</view>
					<view class="product-info">
						<image class="product-img" :src="item.productPic" mode="aspectFill"></image>
						<view class="product-detail">
							<text class="product-name">{{item.productName}}</text>
							<text class="product-attr">{{item.productAttr | formatProductAttr}}</text>
						</view>
					</view>
				</view>
				
				<!-- 评价表单，仅对选中的商品显示 -->
				<view class="evaluation-form" v-if="item.selected">
					<view class="rating-section">
						<text class="section-title">商品评分</text>
						<view class="rating-stars">
							<text class="yticon" 
								v-for="(star, starIndex) in 5" 
								:key="starIndex"
								:class="starIndex < item.rating ? 'icon-xingxing' : 'icon-xingxing'"
								:style="{color: starIndex < item.rating ? '#fa436a' : '#ddd'}"
								@click="setRating(item, starIndex + 1)">
							</text>
						</view>
					</view>
					
					<view class="comment-section">
						<text class="section-title">评价内容</text>
						<textarea class="comment-input" 
							v-model="item.comment" 
							placeholder="请输入您的评价内容"
							maxlength="500">
						</textarea>
					</view>
					
					<view class="upload-section">
						<text class="section-title">上传图片</text>
						<view class="upload-list">
							<view class="upload-item" v-for="(pic, picIndex) in item.pics" :key="picIndex">
								<image :src="pic" mode="aspectFill"></image>
								<text class="delete-btn yticon icon-shanchu4" @click="deleteImage(item, picIndex)"></text>
							</view>
							<view class="upload-btn" @click="chooseImage(item)" v-if="item.pics.length < 9">
								<text class="yticon icon-jia1"></text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 操作栏 -->
		<view class="footer">
			<view class="select-all" @click="toggleSelectAll">
				<text class="yticon" :class="{'icon-xuanzhong2': isAllSelected, 'icon-yuan': !isAllSelected}"></text>
				<text class="text">全选</text>
			</view>
			<view class="action-btns">
				<button class="submit-btn" :disabled="selectedCount === 0" @click="submitEvaluation">评价商品 ({{selectedCount}})</button>
			</view>
		</view>
	</view>
</template>

<script>
import { getOrderProductsForComment, createBatchProductComment } from '@/api/order.js';
import { API_BASE_URL } from '@/utils/appConfig.js';

export default {
	data() {
		return {
			orderId: null,
			productList: [],
			uploading: false
		}
	},
	computed: {
		// 判断是否全选
		isAllSelected() {
			if(this.productList.length === 0) return false;
			return this.productList.every(item => item.selected);
		},
		// 选中的商品数量
		selectedCount() {
			return this.productList.filter(item => item.selected).length;
		}
	},
	onLoad(options) {
		if(options.orderId) {
			this.orderId = options.orderId;
			this.loadOrderProducts();
		}
	},
	methods: {
		// 加载订单商品
		loadOrderProducts() {
			uni.showLoading({
				title: '加载中...'
			});
			getOrderProductsForComment(this.orderId).then(response => {
				uni.hideLoading();
				if(response.code === 200 && response.data) {
					// 为每个商品添加评价相关属性
					this.productList = response.data.map(item => {
						return {
							...item,
							selected: false,  // 是否选中
							rating: 5,        // 默认5星评价
							comment: '',      // 评价内容
							pics: []          // 图片列表
						};
					});
				}
			}).catch(() => {
				uni.hideLoading();
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			});
		},
		
		// 切换商品选中状态
		toggleProduct(item) {
			item.selected = !item.selected;
		},
		
		// 全选/取消全选
		toggleSelectAll() {
			const newStatus = !this.isAllSelected;
			this.productList.forEach(item => {
				item.selected = newStatus;
			});
		},
		
		// 设置评分
		setRating(item, rating) {
			item.rating = rating;
		},
		
		// 选择图片
		chooseImage(item) {
			uni.chooseImage({
				count: 9 - item.pics.length,
				success: (res) => {
					item.pics = [...item.pics, ...res.tempFilePaths];
				}
			});
		},
		
		// 删除图片
		deleteImage(item, index) {
			item.pics.splice(index, 1);
		},
		
		// 提交评价
		async submitEvaluation() {
			// 获取选中的商品
			const selectedProducts = this.productList.filter(item => item.selected);
			if(selectedProducts.length === 0) {
				uni.showToast({
					title: '请选择要评价的商品',
					icon: 'none'
				});
				return;
			}
			
			// 验证评价内容
			for(let product of selectedProducts) {
				if(!product.comment.trim()) {
					uni.showToast({
						title: `请填写"${product.productName}"的评价内容`,
						icon: 'none'
					});
					return;
				}
			}
			
			// 如果有图片需要上传，先处理图片上传
			const hasImages = selectedProducts.some(product => product.pics.length > 0);
			if(hasImages) {
				uni.showLoading({
					title: '正在上传图片...'
				});
				
				// 防止重复上传
				if(this.uploading) return;
				this.uploading = true;
				
				try {
					// 处理每个产品的图片上传
					for(let product of selectedProducts) {
						if(product.pics.length > 0) {
							// 等待所有图片上传完成
							await this.uploadProductImages(product);
						}
					}
					
					// 图片上传完成后提交评价
					this.submitComments(selectedProducts);
				} catch(error) {
					uni.hideLoading();
					this.uploading = false;
					uni.showToast({
						title: '图片上传失败',
						icon: 'none'
					});
				}
			} else {
				// 没有图片，直接提交评价
				this.submitComments(selectedProducts);
			}
		},
		
		// 上传产品图片
		uploadProductImages(product) {
			return new Promise((resolve, reject) => {
				const uploadedUrls = [];
				let uploadedCount = 0;
				const totalCount = product.pics.length;
				
				product.pics.forEach((pic, index) => {
					uni.uploadFile({
						url: API_BASE_URL + '/upload/image', // 后端图片上传接口
						filePath: pic,
						name: 'file',
						header: {
							'Authorization': uni.getStorageSync('token')
						},
						success: (res) => {
							try {
								const data = JSON.parse(res.data);
								if(data.code === 200) {
									uploadedUrls[index] = data.data;
								} else {
									reject(data.message || '图片上传失败');
								}
							} catch(e) {
								reject('图片上传异常');
							}
						},
						fail: () => {
							reject('图片上传网络错误');
						},
						complete: () => {
							uploadedCount++;
							if(uploadedCount === totalCount) {
								product.uploadedPics = uploadedUrls.filter(url => url);
								resolve();
							}
						}
					});
				});
			});
		},
		
		// 提交所有评价
		submitComments(products) {
			uni.showLoading({
				title: '提交评价...'
			});
			
			// 构建评价数据
			const commentItems = products.map(product => {
				return {
					productId: product.productId,
					rating: product.rating,
					comment: product.comment,
					pics: product.uploadedPics || []
				};
			});
			
			// 提交批量评价
			createBatchProductComment({
				orderId: this.orderId,
				commentItems: commentItems
			}).then(response => {
				uni.hideLoading();
				this.uploading = false;
				
				if(response.code === 200) {
					uni.showToast({
						title: '评价成功'
					});
					
					// 通知订单列表页面刷新数据
					uni.$emit('orderListRefresh');
					
					// 延迟返回
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
				this.uploading = false;
				uni.showToast({
					title: '评价失败，请重试',
					icon: 'none'
				});
			});
		}
	},
	filters: {
		// 格式化商品属性
		formatProductAttr(attr) {
			if(!attr) return '';
			try {
				const attributes = JSON.parse(attr);
				return attributes.map(item => `${item.key}: ${item.value}`).join('; ');
			} catch(e) {
				return attr;
			}
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

.header {
	background: #fff;
	padding: 30rpx;
	
	.title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
	}
	
	.sub-title {
		font-size: 24rpx;
		color: #999;
		margin-top: 10rpx;
	}
}

.products-section {
	margin-top: 20rpx;
}

.product-item {
	background: #fff;
	margin-bottom: 20rpx;
	
	.product-header {
		display: flex;
		padding: 30rpx;
		
		.checkbox {
			display: flex;
			align-items: center;
			margin-right: 20rpx;
			
			.yticon {
				font-size: 40rpx;
				color: #fa436a;
			}
		}
		
		.product-info {
			display: flex;
			flex: 1;
			
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
	}
	
	.evaluation-form {
		padding: 0 30rpx 30rpx;
		border-top: 1px solid #f5f5f5;
		
		.section-title {
			font-size: 28rpx;
			color: #333;
			margin: 20rpx 0;
			display: block;
		}
		
		.rating-section {
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
			.comment-input {
				width: 100%;
				height: 200rpx;
				background: #f8f8f8;
				padding: 20rpx;
				font-size: 28rpx;
				color: #333;
				border-radius: 8rpx;
			}
		}
		
		.upload-section {
			.upload-list {
				display: flex;
				flex-wrap: wrap;
				
				.upload-item, .upload-btn {
					width: 160rpx;
					height: 160rpx;
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
						top: -10rpx;
						right: -10rpx;
						width: 40rpx;
						height: 40rpx;
						line-height: 40rpx;
						text-align: center;
						background: rgba(0,0,0,0.5);
						color: #fff;
						border-radius: 50%;
						font-size: 24rpx;
					}
				}
				
				.upload-btn {
					display: flex;
					justify-content: center;
					align-items: center;
					background: #f5f5f5;
					border: 1px dashed #ddd;
					border-radius: 8rpx;
					
					.yticon {
						font-size: 60rpx;
						color: #ccc;
					}
				}
			}
		}
	}
}

.footer {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 100rpx;
	background: #fff;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 30rpx;
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
	
	.select-all {
		display: flex;
		align-items: center;
		
		.yticon {
			font-size: 40rpx;
			color: #fa436a;
			margin-right: 10rpx;
		}
		
		.text {
			font-size: 28rpx;
			color: #333;
		}
	}
	
	.action-btns {
		.submit-btn {
			width: 240rpx;
			height: 70rpx;
			line-height: 70rpx;
			text-align: center;
			background: #fa436a;
			color: #fff;
			border-radius: 35rpx;
			font-size: 28rpx;
			padding: 0;
			
			&:disabled {
				background: #ccc;
			}
		}
	}
}
</style> 