<template>
	<view class="container">
		<!-- 空白页 -->
		<view v-if="!hasLogin || empty===true" class="empty">
			<image src="/static/empty-cart.png" mode="aspectFit" @click="navToIndex"></image>
			<view v-if="hasLogin" class="empty-tips">
				购物车是空的
				<navigator class="navigator" v-if="hasLogin" url="../index/index" open-type="switchTab">点这里去逛逛></navigator>
			</view>
			<view v-else class="empty-tips">
				购物车是空的
				<view class="navigator" @click="navToLogin">去登陆></view>
			</view>
		</view>
		<view v-else>
			<!-- 列表 -->
			<view class="cart-list">
				<block v-for="(item, index) in cartList" :key="item.id">
					<view class="cart-item" :class="{'b-b': index!==cartList.length-1}">
						<view class="image-wrapper" @click="navToDetailPage(item)">
							<image :src="item.productPic" :class="[item.loaded]" mode="aspectFill" lazy-load @load="onImageLoad('cartList', index)"
							 @error="onImageError('cartList', index)"></image>
							<view class="yticon icon-xuanzhong2 checkbox" :class="{checked: item.checked}" @click.stop="check('item', index)"></view>
						</view>
						<view class="item-right" @click="navToDetailPage(item)">
							<text class="clamp title">{{item.productName}}</text>
							<text class="attr">{{item.spDataStr}}</text>
							<text class="price">¥{{item.price}}</text>
							<uni-number-box class="step" :min="1" :max="100" :value="item.quantity" :index="index" @eventChange="numberChange"></uni-number-box>
						</view>
						<text class="del-btn yticon icon-fork" @click="handleDeleteCartItem(index)"></text>
					</view>
				</block>
			</view>
			<!-- 底部菜单栏 -->
			<view class="action-section">
				<view class="left-area">
					<view class="checkbox">
						<image :src="allChecked?'/static/selected.png':'/static/select.png'" mode="aspectFit" @click="check('all')"></image>
						<text class="checkbox-text">全选</text>
					</view>
					<view class="clear-btn" @click="clearCart">
						<text class="yticon icon-iconfontshanchu1"></text>
						<text class="clear-btn-text">清空</text>
					</view>
				</view>
				<view class="spacer"></view>
				<button type="primary" class="no-border confirm-btn" @click="createOrder">结算(共{{selectedCount}}件)</button>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		mapState
	} from 'vuex';
	import uniNumberBox from '@/components/uni-number-box.vue';
	import {
		fetchCartList,
		deletCartItem,
		updateQuantity,
		clearCartList
	} from '@/api/cart.js';
	export default {
		components: {
			uniNumberBox
		},
		data() {
			return {
				total: 0, //总价格
				allChecked: false, //全选状态  true|false
				empty: false, //空白页现实  true|false
				cartList: [],
				sliderX: 0, // 滑块初始位置
				slideThreshold: 100 // 触发清空的阈值
			};
		},
		onLoad() {
			// this.loadData();
		},
		onShow(){
			//页面显示时重新加载购物车
			this.loadData();
		},
		watch: {
			//显示空白页
			cartList(e) {
				let empty = e.length === 0 ? true : false;
				if (this.empty !== empty) {
					this.empty = empty;
				}
			}
		},
		computed: {
			...mapState(['hasLogin']),
			selectedCount() {
				if (!this.cartList.length) {
					return 0;
				}
				let count = 0;
				this.cartList.forEach(item => {
					if (item.checked) {
						count += item.quantity;
					}
				});
				return count;
			}
		},
		methods: {
			//请求数据
			async loadData() {
				if(!this.hasLogin){
					return;
				}
				fetchCartList().then(response => {
					let list = response.data;
					let cartList = list.map(item => {
						item.checked = true;
						item.loaded = "loaded";
						let spDataArr = JSON.parse(item.productAttr);
						let spDataStr = '';
						for (let attr of spDataArr) {
							spDataStr += attr.key;
							spDataStr += ":";
							spDataStr += attr.value;
							spDataStr += ";";
						}
						item.spDataStr = spDataStr;
						return item;
					});
					this.cartList = cartList;
					this.calcTotal(); //计算总价
				});
			},
			//监听image加载完成
			onImageLoad(key, index) {
				this.$set(this[key][index], 'loaded', 'loaded');
			},
			//监听image加载失败
			onImageError(key, index) {
				this[key][index].productPic = '/static/errorImage.jpg';
			},
			navToLogin() {
				uni.navigateTo({
					url: '/pages/public/login'
				})
			},
			// 导航到首页
			navToIndex() {
				uni.switchTab({
					url: '/pages/index/index'
				})
			},
			//选中状态处理
			check(type, index) {
				if (type === 'item') {
					this.cartList[index].checked = !this.cartList[index].checked;
				} else {
					const checked = !this.allChecked
					const list = this.cartList;
					list.forEach(item => {
						item.checked = checked;
					})
					this.allChecked = checked;
				}
				this.calcTotal(type);
			},
			//数量
			numberChange(data) {
				let cartItem = this.cartList[data.index];
				updateQuantity({id:cartItem.id,quantity:data.number}).then(response=>{
					cartItem.quantity = data.number;
					this.calcTotal();
				});
			},
			//删除
			handleDeleteCartItem(index) {
				let list = this.cartList;
				let row = list[index];
				let id = row.id;
				deletCartItem({ids:id}).then(response=>{
					this.cartList.splice(index, 1);
					this.calcTotal();
					uni.hideLoading();
				});
			},
			//计算总价
			calcTotal() {
				let list = this.cartList;
				if (list.length === 0) {
					this.empty = true;
					return;
				}
				let total = 0;
				let checked = true;
				list.forEach(item => {
					if (item.checked === true) {
						total += item.price * item.quantity;
					} else if (checked === true) {
						checked = false;
					}
				})
				this.allChecked = checked;
				this.total = Number(total.toFixed(2));
			},
			//创建订单
			createOrder() {
				let list = this.cartList;
				let cartIds = [];
				list.forEach(item => {
					if (item.checked) {
						cartIds.push(item.id);
					}
				})
				if(cartIds.length==0){
					uni.showToast({
						title:'您还未选择要下单的商品！',
						duration:1000
					})
					return;
				}
				uni.navigateTo({
					url: `/pages/order/createOrder?cartIds=${JSON.stringify(cartIds)}`
				})
			},
			//跳转到商品详情页
			navToDetailPage(item) {
				uni.navigateTo({
					url: `/pages/product/product?id=${item.productId}`
				})
			},
			// 处理滑块移动
			onSliderChange(e) {
				let x = e.detail.x;
				if (x > this.slideThreshold) {
					// 触发清空操作
					this.sliderX = 0; // 重置滑块位置
					this.clearCart();
				}
			},
			//清空
			clearCart() {
				uni.showModal({
					content: '清空购物车？',
					success: (e) => {
						if (e.confirm) {
							clearCartList().then(response => {
								this.cartList = [];
							});
						}
					}
				});
			}
		}
	}
</script>

<style lang='scss'>
	.container {
		/* #ifdef APP-PLUS || MP */
		padding-bottom: calc(100upx + env(safe-area-inset-bottom));
		/* #endif */
		/* #ifdef H5 */
		padding-bottom: 150upx;
		/* #endif */

		/* 空白页 */
		.empty {
			position: fixed;
			left: 0;
			top: 0;
			width: 100%;
			height: 100vh;
			padding-bottom: 100upx;
			display: flex;
			justify-content: center;
			flex-direction: column;
			align-items: center;
			background: #fff;

			image {
				width: 240upx;
				height: 160upx;
				margin-bottom: 30upx;
			}

			.empty-tips {
				display: flex;
				font-size: $font-sm+2upx;
				color: $font-color-disabled;

				.navigator {
					color: $uni-color-primary;
					margin-left: 16upx;
				}
			}
		}
	}

	/* 购物车列表项 */
	.cart-item {
		display: flex;
		position: relative;
		padding: 30upx 40upx;

		.image-wrapper {
			width: 230upx;
			height: 230upx;
			flex-shrink: 0;
			position: relative;

			image {
				border-radius: 8upx;
			}
		}

		.checkbox {
			position: absolute;
			left: -16upx;
			top: -16upx;
			z-index: 8;
			font-size: 44upx;
			line-height: 1;
			padding: 4upx;
			color: $font-color-disabled;
			background: #fff;
			border-radius: 50px;
		}

		.item-right {
			display: flex;
			flex-direction: column;
			flex: 1;
			overflow: hidden;
			position: relative;
			padding-left: 30upx;

			.title,
			.price {
				font-size: $font-base + 2upx;
				color: $font-color-dark;
				height: 40upx;
				line-height: 40upx;
			}

			.attr {
				font-size: $font-sm + 2upx;
				color: $font-color-light;
				height: 50upx;
				line-height: 50upx;
			}

			.price {
				height: 50upx;
				line-height: 50upx;
			}
		}

		.del-btn {
			padding: 4upx 10upx;
			font-size: 34upx;
			height: 50upx;
			color: $font-color-light;
		}
	}

	/* 底部栏 */
	.action-section {
		/* #ifdef H5 */
		margin-bottom: 55upx;
		/* #endif */
		position: fixed;
		left: 0;
		/* #ifdef APP-PLUS || MP */
		bottom: var(--window-bottom);
		padding-bottom: env(safe-area-inset-bottom);
		/* #endif */
		/* #ifdef H5 */
		bottom: 1px; /* H5环境下tabbar的高度为50px */
		/* #endif */
		z-index: 95;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		height: 100upx;
		padding-left: 30upx;
		padding-right: 30upx;
		background: rgba(255, 255, 255, .7);
		box-shadow: 0 -2upx 10upx 0 rgba(0, 0, 0, .2);

		.left-area {
			display: flex;
			align-items: center;
		}

		.checkbox {
			height: 52upx;
			position: relative;
			display: flex;
			align-items: center;

			image {
				width: 52upx;
				height: 100%;
				position: relative;
				z-index: 5;
			}
			
			.checkbox-text {
				font-size: 28upx;
				margin-left: 10upx;
				color: $font-color-dark;
			}
		}

		.clear-btn {
			height: 52upx;
			position: relative;
			display: flex;
			align-items: center;
			margin-left: 25upx;

			.yticon {
				font-size: 38upx;
				color: #286090;
			}
			
			.clear-btn-text {
				font-size: 28upx;
				color: $font-color-dark;
				margin-left: 8upx;
			}
		}

		.spacer {
			flex: 1;
		}
		
		.confirm-btn {
			padding: 0 38upx;
			margin: 0;
			border-radius: 100px;
			height: 76upx;
			line-height: 76upx;
			font-size: $font-base + 2upx;
			background: $uni-color-primary;
			box-shadow: 1px 2px 5px rgba(40, 96, 144, 0.4);
		}
	}

	/* 复选框选中状态 */
	.action-section .checkbox.checked,
	.cart-item .checkbox.checked {
		color: $uni-color-primary;
	}
</style>
