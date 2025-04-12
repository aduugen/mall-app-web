<template>
	<view class="content">
		<view class="header">
			<view class="title">评价商品</view>
			<view class="sub-title">订单: {{orderId}}</view>
		</view>
		
		<!-- 商品列表 -->
		<view class="products-section">
			<view class="product-item" 
				v-for="item in productList" 
				:key="item.productId"
				:class="{'edited': editedItems.includes(item.productId)}">
				<view class="product-header" @click="toggleProduct(item)">
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
							maxlength="500"
							@input="handleCommentInput(item)">
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
			<view class="action-btns">
				<button class="submit-btn" 
					:disabled="editedCount === 0" 
					@click="submitEvaluation"
					:class="{'btn-disabled': editedCount === 0}">
					{{ editedCount > 0 ? `评价商品 (${editedCount})` : '请先编辑商品' }}
				</button>
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
			uploading: false,
			editedItems: [] // 记录已编辑的商品ID
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
		},
		// 已编辑的商品数量
		editedCount() {
			return this.editedItems.length;
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
				console.log('获取评价商品列表响应:', JSON.stringify(response));
				
				if(response.code === 200 && response.data) {
					console.log('原始商品数据:', JSON.stringify(response.data));
					
					// 为每个商品添加评价相关属性
					this.productList = response.data.map(item => {
						console.log('处理商品:', item.productName, item.productId);
						return {
							...item,
							selected: true,  // 默认选中所有商品
							rating: 5,        // 默认5星评价
							comment: '',      // 评价内容
							pics: []          // 图片列表
						};
					});
					
					// 初始化编辑状态
					this.initEditStatus();
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
			// 切换当前商品的选中状态
			item.selected = !item.selected;
			
			// 如果是选中状态，确保有内容填写提示
			if(item.selected) {
				// 如果是首次展开，可以添加一些默认内容或提示
				if(!item.comment) {
					// 这里可以设置一些默认评价内容或提示，也可以留空
					console.log('商品已选中，请填写评价内容');
				}
			}
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
			// 获取已编辑且选中的商品
			const editedProducts = this.productList.filter(item => 
				item.selected && this.editedItems.includes(item.productId)
			);
			
			if(editedProducts.length === 0) {
				uni.showToast({
					title: '请先编辑商品评价',
					icon: 'none'
				});
				return;
			}
			
			// 验证评价内容
			for(let product of editedProducts) {
				if(!product.comment.trim()) {
					uni.showToast({
						title: `请填写"${product.productName}"的评价内容`,
						icon: 'none'
					});
					return;
				}
			}
			
			// 如果有图片需要上传，先处理图片上传
			const hasImages = editedProducts.some(product => product.pics.length > 0);
			if(hasImages) {
				uni.showLoading({
					title: '正在上传图片...'
				});
				
				// 防止重复上传
				if(this.uploading) return;
				this.uploading = true;
				
				try {
					// 处理每个产品的图片上传
					for(let product of editedProducts) {
						if(product.pics.length > 0) {
							// 等待所有图片上传完成
							await this.uploadProductImages(product);
						}
					}
					
					// 图片上传完成后提交评价
					this.submitComments(editedProducts);
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
				this.submitComments(editedProducts);
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
					orderItemId: product.id,
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
		},
		
		// 处理复选框点击
		handleCheckboxClick(item, event) {
			// 阻止事件冒泡，避免触发整个商品条目的点击
			event.stopPropagation();
			
			// 这里只更新复选框状态，不展开/收起评价表单
			item.selected = !item.selected;
		},
		
		// 处理评价内容输入
		handleCommentInput(item) {
			this.$nextTick(() => {
				// 使用nextTick确保获取到最新的评价内容
				const hasContent = item.comment && item.comment.trim().length > 0;
				const isEdited = this.editedItems.includes(item.productId);
				
				// 根据内容状态更新编辑列表
				if (hasContent && !isEdited) {
					// 有内容但未标记为已编辑，添加到已编辑列表
					this.editedItems.push(item.productId);
					console.log('商品已编辑:', item.productId);
				} else if (!hasContent && isEdited) {
					// 无内容但标记为已编辑，从已编辑列表移除
					const index = this.editedItems.indexOf(item.productId);
					if (index > -1) {
						this.editedItems.splice(index, 1);
						console.log('商品编辑状态重置:', item.productId);
					}
				}
			});
		},
		
		// 初始化编辑状态
		initEditStatus() {
			// 检查所有商品的评价内容，如有内容则标记为已编辑
			this.productList.forEach(item => {
				if (item.comment && item.comment.trim()) {
					if (!this.editedItems.includes(item.productId)) {
						this.editedItems.push(item.productId);
					}
				}
			});
			
			// 如果没有已编辑商品，显示提示
			if (this.editedItems.length === 0) {
				setTimeout(() => {
					uni.showToast({
						title: '请编辑商品评价',
						icon: 'none',
						duration: 2000
					});
				}, 500);
			}
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
	border-radius: 8rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	overflow: hidden;
	position: relative;
	
	&.edited {
		.product-header {
			background-color: rgba(51, 153, 255, 0.1); // 半透明浅蓝色
			transition: background-color 0.3s ease;
			
			&::after {
				color: #3399ff; // 已编辑状态的箭头颜色变为蓝色
			}
		}
		
		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 0;
			width: 8rpx;
			height: 220rpx; // 调整为与商品头部高度一致
			background-color: #3399ff;
		}
		
		// 添加已编辑标记
		.product-detail::after {
			content: '已编辑';
			position: absolute;
			right: 70rpx;
			top: 30rpx;
			font-size: 20rpx;
			color: #3399ff;
			background-color: rgba(51, 153, 255, 0.1);
			padding: 4rpx 10rpx;
			border-radius: 10rpx;
		}
	}
	
	.product-header {
		display: flex;
		padding: 30rpx;
		position: relative;
		transition: background-color 0.2s;
		background-color: #fff; // 默认背景色
		
		&:active {
			background-color: #f9f9f9;
		}
		
		&::after {
			content: '\e606';  /* 右箭头图标 */
			font-family: "yticon";
			position: absolute;
			right: 30rpx;
			top: 50%;
			transform: translateY(-50%);
			color: #ccc;
			font-size: 30rpx;
		}
		
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
		animation: slideDown 0.3s ease-out;
		
		@keyframes slideDown {
			from {
				opacity: 0;
				transform: translateY(-10px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
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
	justify-content: center;
	align-items: center;
	padding: 0 30rpx;
	box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
	
	.action-btns {
		.submit-btn {
			width: 320rpx;
			height: 70rpx;
			line-height: 70rpx;
			text-align: center;
			background: #fa436a;
			color: #fff;
			border-radius: 35rpx;
			font-size: 28rpx;
			padding: 0;
			transition: all 0.3s ease;
			
			&.btn-disabled {
				background: #cccccc;
				color: #999999;
				opacity: 0.8;
				box-shadow: none;
				cursor: not-allowed;
			}
			
			&:disabled {
				background: #cccccc;
				color: #999999;
				opacity: 0.8;
				box-shadow: none;
			}
			
			&:active:not(:disabled) {
				transform: scale(0.98);
				opacity: 0.9;
			}
		}
	}
}

.icon-checkboxchecked {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 60upx;
			height: 60upx;
			font-size: 40upx;
			color: $base-color;
		}
.icon-checkboxunchecked {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 60upx;
			height: 60upx;
		}
</style> 