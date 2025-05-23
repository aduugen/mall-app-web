<template>
	<view class="content">
		<view class="order-section">
			<view class="section-title">选择退货商品</view>
			<view class="goods-list">
				<view class="goods-item" v-for="(item, index) in orderInfo.orderItemList" :key="index">
					<!-- 如果商品可申请数量为0，则禁用选择 -->
					<view v-if="!item.availableQuantity || item.availableQuantity <= 0" class="unavailable-tip">
						<text class="unavailable-text">已全部退货</text>
					</view>
					<checkbox v-else :checked="isItemSelected(item.id)" @tap="toggleSelect(item.id)" color="#fa436a"/>
					<image class="goods-img" :src="item.productPic" mode="aspectFill"></image>
					<view class="goods-info">
						<text class="goods-name">{{item.productName}}</text>
						<text class="goods-attr">{{item.productAttr | formatProductAttr}}</text>
						<view class="goods-price">
							<text class="price">￥{{item.realAmount}}</text>
							<text class="quantity">x {{item.productQuantity}}</text>
						</view>
						<view class="applied-info" v-if="item.appliedQuantity > 0">
							<text class="applied-text">已申请退货: {{item.appliedQuantity}}件</text>
							<text class="available-text">可申请退货: {{item.availableQuantity}}件</text>
						</view>
						<view class="return-quantity" v-if="isItemSelected(item.id)">
							<text class="quantity-label">退货数量:</text>
							<view class="quantity-selector">
								<text class="btn minus" @tap="decreaseQuantity(item.id)">-</text>
								<input type="number" class="num" v-model="returnQuantities[item.id]" @input="validateQuantity(item.id, item.availableQuantity)" />
								<text class="btn plus" @tap="increaseQuantity(item.id, item.availableQuantity)">+</text>
							</view>
							<text class="max-quantity">最多{{item.availableQuantity}}件</text>
						</view>
						<view class="item-reason-section" v-if="isItemSelected(item.id)">
							<view class="reason-title">退货原因</view>
							<view class="reason-picker">
								<picker @change="changeReason(item.id, $event)" :value="getSelectedReasonIndex(item.id)" :range="reasonList">
									<view class="reason-picker-value">
										<text>{{getSelectedReason(item.id) || '请选择退货原因'}}</text>
										<text class="yticon icon-you"></text>
									</view>
								</picker>
							</view>
							<view class="custom-reason" v-if="getSelectedReason(item.id) === '其他原因'">
								<textarea class="reason-input" 
									:value="getCustomReason(item.id)" 
									@input="updateCustomReason(item.id, $event.detail.value)"
									placeholder="请输入具体原因"
									maxlength="200">
								</textarea>
							</view>
						</view>
						<view class="item-upload-section" v-if="isItemSelected(item.id)">
							<view class="upload-title">上传凭证</view>
							<view class="upload-list">
								<view class="upload-item" v-for="(pic, picIndex) in getItemPics(item.id)" :key="picIndex">
									<image :src="pic" mode="aspectFill"></image>
									<text class="delete-btn yticon icon-shanchu4" @click="deleteItemImage(item.id, picIndex)"></text>
								</view>
								<view class="upload-btn" @click="chooseItemImage(item.id)" v-if="getItemPics(item.id).length < 3">
									<text class="yticon icon-jia1"></text>
								</view>
							</view>
						</view>
					</view>
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
import { checkOrderAfterSaleStatus } from '@/api/afterSale.js';

export default {
	data() {
		return {
			orderId: null,
			orderInfo: {},
			selectedItems: [],
			returnQuantities: {}, // 存储每个商品的退货数量
			itemReasons: {}, // 存储每个商品的退货原因
			itemCustomReasons: {}, // 存储每个商品的自定义退货原因
			itemPics: {}, // 存储每个商品的凭证图片
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
			],
			orderItemAppliedStatusMap: {},
			isSubmitting: false, // 是否正在提交申请
			isNavigatingBack: false // 是否正在返回上一页
		}
	},
	filters: {
		formatProductAttr(jsonAttr) {
			if(!jsonAttr || jsonAttr === '[]') return '';
			let attrObj = JSON.parse(jsonAttr);
			return attrObj.map(item => item.key + ":" + item.value).join('; ');
		}
	},
	onLoad(options) {
		if(options.orderId) {
			this.orderId = options.orderId;
			
			// 加载前检查订单售后状态
			this.checkOrderAfterSaleStatus().then(() => {
				this.getOrderDetail();
			}).catch(() => {
				// 状态检查失败也尝试加载订单详情
				this.getOrderDetail();
			});
		}
	},
	onUnload() {
		// 页面卸载时清理状态
		this.isSubmitting = false;
		this.isNavigatingBack = false;
	},
	methods: {
		getOrderDetail() {
			// 如果页面已经准备返回，则不再处理
			if (this.isNavigatingBack) {
				return;
			}
			
			console.log("开始获取订单详情");
			uni.showLoading({
				title: '加载中...',
				mask: true
			});
			fetchOrderDetail(this.orderId).then(response => {
				uni.hideLoading();
				if(response.data) {
					this.orderInfo = response.data;
					
					// 使用过滤方法过滤掉已全部申请售后的商品
					if (this.orderInfo.orderItemList && this.orderInfo.orderItemList.length > 0) {
						// 先处理每个订单项的可申请数量和已申请数量
						this.orderInfo.orderItemList.forEach(item => {
							// 确保item.id数值化
							const itemId = parseInt(item.id);
							
							// 从售后状态记录中获取已申请数量和可申请数量
							let appliedQuantity = 0;
							let availableQuantity = item.productQuantity;
							
							if (this.orderItemAppliedStatusMap && this.orderItemAppliedStatusMap[itemId]) {
								const status = this.orderItemAppliedStatusMap[itemId];
								appliedQuantity = parseInt(status.appliedQuantity || 0);
								availableQuantity = parseInt(status.availableQuantity || 0);
							} else {
								// 如果没有售后状态记录，则默认全部可申请
								appliedQuantity = 0;
								availableQuantity = parseInt(item.productQuantity || 0);
							}
							
							// 设置到订单项对象中，确保为数字类型
							item.appliedQuantity = appliedQuantity;
							item.availableQuantity = availableQuantity;
						});
						
						// 然后过滤掉已全部申请售后的商品
						const filteredItems = this.filterOrderItems(this.orderInfo.orderItemList);
						this.orderInfo.orderItemList = filteredItems;
						
						// 如果过滤后没有可申请售后的商品，提示用户并返回
						if (this.orderInfo.orderItemList.length === 0) {
							// 标记为正在返回，避免重复检查
							this.isNavigatingBack = true;
							
							uni.showModal({
								title: '提示',
								content: '该订单商品已全部申请售后，无法再次申请',
								showCancel: false,
								success: () => {
									uni.navigateBack();
								}
							});
							return;
						}
						
						// 初始化选中商品和申请数量
						this.orderInfo.orderItemList.forEach(item => {
							item.checked = false;
							// 默认退货数量设置为可申请数量
							item.returnQuantity = item.availableQuantity;
						});
					}
				} else {
					uni.showToast({
						title: '获取订单详情失败',
						icon: 'none'
					});
				}
			}).catch(err => {
				uni.hideLoading();
				console.error("获取订单详情失败:", err);
				uni.showToast({
					title: '获取订单详情失败',
					icon: 'none'
				});
			});
		},
		isItemSelected(itemId) {
			return this.selectedItems.indexOf(itemId) > -1;
		},
		toggleSelect(itemId) {
			const index = this.selectedItems.indexOf(itemId);
			if(index > -1) {
				this.selectedItems.splice(index, 1);
			} else {
				this.selectedItems.push(itemId);
				// 默认设置退货数量为可申请数量
				const item = this.orderInfo.orderItemList.find(item => item.id === itemId);
				if (item) {
					// 使用可申请数量而非购买数量
					this.$set(this.returnQuantities, itemId, item.availableQuantity || 1);
					// 初始化该商品的退货原因和凭证
					if (!this.itemReasons[itemId]) {
						this.$set(this.itemReasons, itemId, '');
					}
					if (!this.itemCustomReasons[itemId]) {
						this.$set(this.itemCustomReasons, itemId, '');
					}
					if (!this.itemPics[itemId]) {
						this.$set(this.itemPics, itemId, []);
					}
				}
			}
		},
		decreaseQuantity(itemId) {
			if (this.returnQuantities[itemId] > 1) {
				this.returnQuantities[itemId]--;
			}
		},
		increaseQuantity(itemId, maxQuantity) {
			// 获取当前商品的可申请数量
			const item = this.orderInfo.orderItemList.find(item => item.id === itemId);
			const availableQuantity = item ? item.availableQuantity : maxQuantity;
			
			if (this.returnQuantities[itemId] < availableQuantity) {
				this.returnQuantities[itemId]++;
			} else {
				uni.showToast({
					title: `最多可申请${availableQuantity}件`,
					icon: 'none'
				});
			}
		},
		validateQuantity(itemId, maxQuantity) {
			// 获取商品项和可申请数量
			const item = this.orderInfo.orderItemList.find(item => item.id === itemId);
			const availableQuantity = item ? item.availableQuantity : maxQuantity;
			
			// 确保输入的数量是有效的整数
			let quantity = parseInt(this.returnQuantities[itemId]);
			if (isNaN(quantity) || quantity < 1) {
				this.$set(this.returnQuantities, itemId, 1);
			} else if (quantity > availableQuantity) {
				this.$set(this.returnQuantities, itemId, availableQuantity);
				uni.showToast({
					title: `最多可申请${availableQuantity}件`,
					icon: 'none'
				});
			} else {
				this.$set(this.returnQuantities, itemId, quantity);
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
		// 商品退货原因相关方法
		changeReason(itemId, e) {
			const index = e.detail.value;
			const reason = this.reasonList[index];
			this.$set(this.itemReasons, itemId, reason);
			
			// 如果不是"其他原因"，清空自定义原因
			if (reason !== '其他原因') {
				this.$set(this.itemCustomReasons, itemId, '');
			}
		},
		
		getSelectedReasonIndex(itemId) {
			const reason = this.itemReasons[itemId];
			return this.reasonList.indexOf(reason);
		},
		
		getSelectedReason(itemId) {
			return this.itemReasons[itemId] || '';
		},
		
		getCustomReason(itemId) {
			return this.itemCustomReasons[itemId] || '';
		},
		
		updateCustomReason(itemId, value) {
			this.$set(this.itemCustomReasons, itemId, value);
		},
		
		// 商品凭证图片相关方法
		getItemPics(itemId) {
			return this.itemPics[itemId] || [];
		},
		
		chooseItemImage(itemId) {
			if (!this.itemPics[itemId]) {
				this.$set(this.itemPics, itemId, []);
			}
			
			uni.chooseImage({
				count: 3 - this.itemPics[itemId].length,
				success: (res) => {
					const pics = [...this.itemPics[itemId], ...res.tempFilePaths];
					this.$set(this.itemPics, itemId, pics);
				}
			});
		},
		
		deleteItemImage(itemId, index) {
			const pics = [...this.itemPics[itemId]];
			pics.splice(index, 1);
			this.$set(this.itemPics, itemId, pics);
		},
		submitAfterSale() {
			// 如果正在提交或已在返回，则不处理
			if (this.isSubmitting || this.isNavigatingBack) {
				return;
			}
			
			// 验证必填信息
			if(this.selectedItems.length === 0) {
				uni.showToast({
					title: '请选择要退货的商品',
					icon: 'none'
				});
				return;
			}
			
			// 验证每个商品的退货原因
			for (let itemId of this.selectedItems) {
				const reason = this.getSelectedReason(itemId);
				if (!reason) {
					uni.showToast({
						title: '请选择所有商品的退货原因',
						icon: 'none'
					});
					return;
				}
				
				if (reason === '其他原因' && !this.getCustomReason(itemId).trim()) {
					uni.showToast({
						title: '请填写自定义退货原因',
						icon: 'none'
					});
					return;
				}
			}
			
			// 标记为正在提交
			this.isSubmitting = true;
			
			// 上传所有商品的凭证图片
			const uploadTasks = [];
			const uploadResults = {};
			
			for (let itemId of this.selectedItems) {
				const pics = this.getItemPics(itemId);
				if (pics.length > 0) {
					uploadResults[itemId] = [];
					
					pics.forEach(pic => {
						const task = this.uploadSingleImage(pic).then(url => {
							uploadResults[itemId].push(url);
						});
						uploadTasks.push(task);
					});
				} else {
					uploadResults[itemId] = [];
				}
			}
			
			// 等待所有图片上传完成
			if (uploadTasks.length > 0) {
				uni.showLoading({
					title: '正在上传图片...'
				});
				
				Promise.all(uploadTasks).then(() => {
					uni.hideLoading();
					this.submitAfterSaleData(uploadResults);
				}).catch(err => {
					uni.hideLoading();
					console.log("图片上传失败"+ err);
					
					// 恢复提交状态
					this.isSubmitting = false;
					
					uni.showToast({
						title: '图片上传失败: ' + err,
						icon: 'none'
					});
				});
			} else {
				this.submitAfterSaleData(uploadResults);
			}
		},
		
		// 上传单个图片
		uploadSingleImage(imagePath) {
			return new Promise((resolve, reject) => {
				// 获取token
				const token = uni.getStorageSync('token');
				
				// 确保token不包含Bearer前缀
				const authToken = token.startsWith('Bearer ') ? token.substring(7) : token;
				
				uni.uploadFile({
					url: API_BASE_URL + '/upload/image',
					filePath: imagePath,
					name: 'file',
					header: {
						'Authorization': authToken
					},
					success: (res) => {
						try {
							// 对返回数据进行处理
							let responseData;
							if (typeof res.data === 'string') {
								responseData = JSON.parse(res.data);
							} else {
								responseData = res.data;
							}
							
							if(responseData.code === 200) {
								resolve(responseData.data);
							} else {
								reject(responseData.message || '图片上传失败');
							}
						} catch(e) {
							reject('图片上传异常: ' + e.message);
						}
					},
					fail: (err) => {
						reject(err.errMsg || '图片上传网络错误');
					}
				});
			});
		},
		
		// 提交售后申请数据
		submitAfterSaleData(uploadResults) {
			uni.showLoading({
				title: '提交申请...'
			});
			
			// 准备售后商品信息
			const afterSaleItems = this.selectedItems.map(itemId => {
				const orderItem = this.orderInfo.orderItemList.find(item => item.id === itemId);
				const reason = this.getSelectedReason(itemId);
				let reasonText = reason === '其他原因' ? this.getCustomReason(itemId) : reason;
				
				// 确保reasonText不为null或undefined
				if (!reasonText || reasonText.trim() === '') {
					console.warn(`检测到商品${orderItem.productName}的退货原因为空，设置为默认值`);
					reasonText = '用户申请退货/退款';
				}
				
				const pics = uploadResults[itemId] || [];
				console.log(`商品${orderItem.productName}的退货原因:`, reasonText);
				
				// 确保只包含后端支持的字段,避免type字段导致错误
				return {
					orderItemId: itemId,
					returnQuantity: parseInt(this.returnQuantities[itemId]),
					productId: orderItem.productId,
					productSkuId: orderItem.productSkuId,
					productName: orderItem.productName,
					productPic: orderItem.productPic,
					productAttr: orderItem.productAttr,
					productPrice: orderItem.productPrice,
					productSkuCode: orderItem.productSkuCode || '',
					returnReason: reasonText,
					proofPics: pics.join(',')
				};
			});
			
			// 构建售后申请数据 - 确保只包含后端OmsAfterSale模型中存在的字段
			const afterSaleData = {
				orderId: this.orderId,
				items: afterSaleItems
				// 移除任何后端模型不存在的字段，如type和reason
			};
			
			// 打印完整数据
			console.log('提交售后申请数据', JSON.stringify(afterSaleData));
			
			createAfterSale(afterSaleData).then(response => {
				uni.hideLoading();
				if(response.code === 200) {
					// 标记为正在返回，避免重复检查
					this.isNavigatingBack = true;
					
					uni.showToast({
						title: '申请提交成功',
						icon: 'success'
					});
					// 通知售后列表页面刷新数据
					uni.$emit('afterSaleListRefresh');
					// 通知订单列表页面刷新数据
					uni.$emit('orderListRefresh');
					setTimeout(() => {
						uni.navigateBack();
					}, 1500);
				} else {
					// 恢复提交状态
					this.isSubmitting = false;
					
					uni.showToast({
						title: response.message || '申请提交失败',
						icon: 'none',
						duration: 3000
					});
				}
			}).catch(error => {
				uni.hideLoading();
				console.error('售后申请提交失败:', error);
				
				// 恢复提交状态
				this.isSubmitting = false;
				
				uni.showToast({
					title: '申请提交失败: ' + (error.message || '未知错误'),
					icon: 'none',
					duration: 3000
				});
			});
		},
		/**
		 * 检查订单售后状态
		 */
		checkOrderAfterSaleStatus() {
			return new Promise((resolve, reject) => {
				checkOrderAfterSaleStatus(this.orderId).then(response => {
					if (response.code === 200) {
						const result = response.data;
						
						// 如果订单不可申请售后，则返回订单列表页
						if (!result.canApplyAfterSale) {
							// 标记为正在返回，避免重复检查
							this.isNavigatingBack = true;
							
							uni.showModal({
								title: '提示',
								content: '该订单商品已全部申请售后，无法再次申请',
								showCancel: false,
								success: () => {
									uni.navigateBack();
								}
							});
							reject(new Error('订单商品已全部申请售后'));
							return;
						}
						
						// 记录每个订单项的可申请数量
						if (result.items && result.items.length > 0) {
							this.orderItemAppliedStatusMap = {};
							
							result.items.forEach(item => {
								// 确保数据都是数字类型
								const appliedQuantity = parseInt(item.appliedQuantity || 0);
								const availableQuantity = parseInt(item.availableQuantity || 0);
								const productQuantity = parseInt(item.productQuantity || 0);
								
								// 存储到映射中
								this.orderItemAppliedStatusMap[item.orderItemId] = {
									appliedQuantity: appliedQuantity,
									availableQuantity: availableQuantity,
									productQuantity: productQuantity,
									isFullyApplied: appliedQuantity >= productQuantity
								};
							});
						}
						
						resolve();
					} else {
						console.error('检查订单售后状态失败:', response.message);
						uni.showToast({
							title: '获取售后状态失败',
							icon: 'none',
							duration: 2000
						});
						resolve(); // 失败也继续加载
					}
				}).catch(error => {
					console.error('检查订单售后状态异常:', error);
					uni.showToast({
						title: '获取售后状态异常',
						icon: 'none',
						duration: 2000
					});
					resolve(); // 异常也继续加载
				});
			});
		},
		
		// 修改商品项过滤方法，过滤掉已全部申请售后的商品
		filterOrderItems(orderItems) {
			if (!orderItems || !orderItems.length) return [];
			
			// 过滤掉没有可申请数量的商品
			return orderItems.filter(item => {
				// 检查是否有可申请数量
				return item.availableQuantity > 0;
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
			
			.unavailable-tip {
				width: 40rpx;
				height: 40rpx;
				margin: 0 20rpx 0 20rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				
				.unavailable-text {
					font-size: 20rpx;
					color: #999;
					background-color: #f1f1f1;
					padding: 4rpx 8rpx;
					border-radius: 4rpx;
					white-space: nowrap;
					transform: scale(0.8);
				}
			}
			
			.goods-img {
				width: 120rpx;
				height: 120rpx;
				border-radius: 8rpx;
				margin: 0 20rpx;
			}
			
			.goods-info {
				flex: 1;
				display: flex;
				flex-direction: column;
				padding-left: 30upx;
				overflow: hidden;
				position: relative;
				
				.goods-name {
					font-size: $font-base + 2upx;
					color: $font-color-dark;
					height: 40upx;
					overflow: hidden;
				}
				
				.goods-attr {
					font-size: $font-sm + 2upx;
					color: $font-color-light;
					height: 40upx;
					overflow: hidden;
				}
				
				.goods-price {
					display: flex;
					align-items: center;
					height: 40upx;
					margin-top: 8upx;
					font-size: $font-sm + 2upx;
					color: $font-color-dark;
					
					.price {
						margin-right: 20upx;
					}
					
					.quantity {
						color: $font-color-light;
					}
				}
				
				.applied-info {
					margin-top: 8upx;
					display: flex;
					font-size: $font-sm;
					
					.applied-text {
						color: #ff6b00;
						margin-right: 20upx;
					}
					
					.available-text {
						color: #07c160;
					}
				}
				
				.return-quantity {
					margin-top: 15upx;
					display: flex;
					flex-wrap: wrap;
					align-items: center;
					
					.quantity-label {
						font-size: $font-sm + 2upx;
						color: $font-color-light;
						margin-right: 10upx;
					}
					
					.quantity-selector {
						display: flex;
						align-items: center;
						height: 56upx;
						border: 2upx solid #f5f5f5;
						border-radius: 8upx;
						overflow: hidden;
						margin-right: 10upx;
						
						.btn {
							width: 60upx;
							height: 56upx;
							line-height: 56upx;
							text-align: center;
							color: #666;
							font-size: 32upx;
							background-color: #f5f5f5;
						}
						
						.num {
							width: 78upx;
							height: 56upx;
							line-height: 56upx;
							text-align: center;
							font-size: 28upx;
							color: #333;
							background-color: #fff;
						}
					}
					
					.max-quantity {
						font-size: 22upx;
						color: #999;
						margin-left: 10upx;
					}
				}

				.item-reason-section {
					margin-top: 15upx;
					
					.reason-title {
						font-size: $font-sm + 2upx;
						color: $font-color-light;
						margin-bottom: 10upx;
					}
					
					.reason-picker {
						.reason-picker-value {
							display: flex;
							justify-content: space-between;
							align-items: center;
							height: 70upx;
							padding: 0 20upx;
							background-color: #f8f8f8;
							border-radius: 8upx;
							font-size: 28upx;
							color: #333;
							
							.yticon {
								color: #ccc;
								font-size: 24upx;
							}
						}
					}
					
					.custom-reason {
						margin-top: 15upx;
						
						.reason-input {
							width: 100%;
							height: 150upx;
							background: #f8f8f8;
							padding: 20upx;
							font-size: 28upx;
							color: #333;
							border-radius: 8upx;
						}
					}
				}
				
				.item-upload-section {
					margin-top: 15upx;
					
					.upload-title {
						font-size: $font-sm + 2upx;
						color: $font-color-light;
						margin-bottom: 10upx;
					}
					
					.upload-list {
						display: flex;
						flex-wrap: wrap;
						
						.upload-item {
							width: 150upx;
							height: 150upx;
							margin-right: 15upx;
							margin-bottom: 15upx;
							position: relative;
							
							image {
								width: 100%;
								height: 100%;
								border-radius: 8upx;
							}
							
							.delete-btn {
								position: absolute;
								right: -10upx;
								top: -10upx;
								width: 40upx;
								height: 40upx;
								background: rgba(0,0,0,0.5);
								border-radius: 50%;
								color: #fff;
								font-size: 24upx;
								display: flex;
								align-items: center;
								justify-content: center;
							}
						}
						
						.upload-btn {
							width: 150upx;
							height: 150upx;
							background: #f8f8f8;
							border-radius: 8upx;
							display: flex;
							align-items: center;
							justify-content: center;
							
							.yticon {
								font-size: 60upx;
								color: #999;
							}
						}
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