<template>
	<view class="content">
		<view class="navbar">
			<view v-for="(item, index) in navList" :key="index" class="nav-item" :class="{current: tabCurrentIndex === index}"
			 @click="tabClick(index)">
				{{item.text}}
			</view>
		</view>

		<swiper :current="tabCurrentIndex" class="swiper-box" duration="300" @change="changeTab">
			<swiper-item class="tab-content" v-for="(tabItem,tabIndex) in navList" :key="tabIndex">
				<scroll-view class="list-scroll-content" scroll-y @scrolltolower="loadData('add')">
					<!-- 空白页 -->
					<empty v-if="afterSaleList==null||afterSaleList.length === 0"></empty>

					<!-- 售后列表 -->
					<view v-for="(item,index) in afterSaleList" :key="index" class="after-sale-item">
						<view class="i-top b-b">
							<text class="time">{{item.createTime | formatDateTime}}</text>
							<text class="state" :style="{color: item.status === 0 ? '#fa436a' : '#999'}">{{item.status | formatStatus}}</text>
						</view>
						
						<view class="goods-box-single" v-for="(orderItem, itemIndex) in item.orderItemList" :key="itemIndex">
							<image class="goods-img" :src="orderItem.productPic" mode="aspectFill"></image>
							<view class="right">
								<text class="title clamp">{{orderItem.productName}}</text>
								<text class="attr-box">{{orderItem.productAttr | formatProductAttr}} x {{orderItem.productQuantity}}</text>
								<text class="price">{{orderItem.productPrice}}</text>
							</view>
						</view>

						<view class="price-box">
							共
							<text class="num">{{calcTotalQuantity(item)}}</text>
							件商品 实付款
							<text class="price">{{item.payAmount}}</text>
						</view>
						
						<view class="action-box b-t">
							<button class="action-btn" @click="showAfterSaleDetail(item.id)">查看详情</button>
							<button v-if="item.status === 0" class="action-btn recom" @click="applyAfterSale(item)">申请售后</button>
						</view>
					</view>

					<uni-load-more :status="loadingType"></uni-load-more>
				</scroll-view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import empty from "@/components/empty";
	import {
		formatDate
	} from '@/utils/date';
	import {
		fetchAfterSaleList
	} from '@/api/afterSale.js';

	export default {
		components: {
			uniLoadMore,
			empty
		},
		data() {
			return {
				tabCurrentIndex: 0,
				afterSaleParam: {
					status: -1,
					pageNum: 1,
					pageSize: 5
				},
				afterSaleList: [],
				loadingType: 'more',
				navList: [{
						state: -1,
						text: '全部'
					},
					{
						state: 0,
						text: '待处理'
					},
					{
						state: 1,
						text: '处理中'
					},
					{
						state: 2,
						text: '已完成'
					},
					{
						state: 3,
						text: '已拒绝'
					}
				],
			};
		},
		onLoad(options) {
			this.tabCurrentIndex = +options.state || 0;
			this.loadData();
		},
		filters: {
			formatStatus(status) {
				let statusTip = '';
				switch (+status) {
					case 0:
						statusTip = '待处理';
						break;
					case 1:
						statusTip = '处理中';
						break;
					case 2:
						statusTip = '已完成';
						break;
					case 3:
						statusTip = '已拒绝';
						break;
				}
				return statusTip;
			},
			formatProductAttr(jsonAttr) {
				let attrArr = JSON.parse(jsonAttr);
				let attrStr = '';
				for (let attr of attrArr) {
					attrStr += attr.key;
					attrStr += ":";
					attrStr += attr.value;
					attrStr += ";";
				}
				return attrStr
			},
			formatDateTime(time) {
				if (time == null || time === '') {
					return 'N/A';
				}
				let date = new Date(time);
				return formatDate(date, 'yyyy-MM-dd hh:mm:ss')
			},
		},
		methods: {
			//获取售后列表
			loadData(type='refresh') {
				if(type=='refresh'){
					this.afterSaleParam.pageNum=1;
				}else{
					this.afterSaleParam.pageNum++;
				}
				let index = this.tabCurrentIndex;
				let navItem = this.navList[index];
				if (this.loadingType === 'loading') {
					return;
				}
				this.afterSaleParam.status = navItem.state;
				this.loadingType = 'loading';
				fetchAfterSaleList(this.afterSaleParam).then(response => {
					let list = response.data.list;
					if(type=='refresh'){
						this.afterSaleList = list;
						this.loadingType = 'more';
					}else{
						if(list!=null&&list.length>0){
							this.afterSaleList = this.afterSaleList.concat(list);
							this.loadingType = 'more';
						}else{
							this.afterSaleParam.pageNum--;
							this.loadingType = 'noMore';
						}
					}
				});
			},
			//swiper 切换
			changeTab(e) {
				this.tabCurrentIndex = e.target.current;
				this.loadData();
			},
			//顶部tab点击
			tabClick(index) {
				this.tabCurrentIndex = index;
			},
			//计算商品总数量
			calcTotalQuantity(order){
				let totalQuantity = 0;
				if(order.orderItemList!=null&&order.orderItemList.length>0){
					for(let item of order.orderItemList){
						totalQuantity+=item.productQuantity
					}
				}
				return totalQuantity;
			},
			//查看售后详情
			showAfterSaleDetail(id) {
				uni.navigateTo({
					url: `/pages/afterSale/afterSaleDetail?id=${id}`
				});
			},
			//申请售后
			applyAfterSale(order) {
				uni.navigateTo({
					url: `/pages/afterSale/applyAfterSale?orderId=${order.id}`
				});
			}
		}
	}
</script>

<style lang="scss">
	page,
	.content {
		background: $page-color-base;
		height: 100%;
	}

	.swiper-box {
		height: calc(100% - 40px);
	}

	.list-scroll-content {
		height: 100%;
	}

	.navbar {
		display: flex;
		height: 40px;
		padding: 0 5px;
		background: #fff;
		box-shadow: 0 1px 5px rgba(0, 0, 0, .06);
		position: relative;
		z-index: 10;

		.nav-item {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			font-size: 15px;
			color: $font-color-dark;
			position: relative;

			&.current {
				color: $base-color;

				&:after {
					content: '';
					position: absolute;
					left: 50%;
					bottom: 0;
					transform: translateX(-50%);
					width: 44px;
					height: 0;
					border-bottom: 2px solid $base-color;
				}
			}
		}
	}

	.after-sale-item {
		display: flex;
		flex-direction: column;
		padding-left: 30upx;
		background: #fff;
		margin-top: 16upx;

		.i-top {
			display: flex;
			align-items: center;
			height: 80upx;
			padding-right: 30upx;
			font-size: $font-base;
			color: $font-color-dark;
			position: relative;

			.time {
				flex: 1;
			}

			.state {
				color: $base-color;
			}
		}

		.goods-box-single {
			display: flex;
			padding: 20upx 0;

			.goods-img {
				display: block;
				width: 120upx;
				height: 120upx;
			}

			.right {
				flex: 1;
				display: flex;
				flex-direction: column;
				padding: 0 30upx 0 24upx;
				overflow: hidden;

				.title {
					font-size: $font-base + 2upx;
					color: $font-color-dark;
					line-height: 1;
				}

				.attr-box {
					font-size: $font-sm + 2upx;
					color: $font-color-light;
					padding: 10upx 12upx;
				}

				.price {
					font-size: $font-base + 2upx;
					color: $font-color-dark;

					&:before {
						content: '￥';
						font-size: $font-sm;
						margin: 0 2upx 0 8upx;
					}
				}
			}
		}

		.price-box {
			display: flex;
			justify-content: flex-end;
			align-items: baseline;
			padding: 20upx 30upx;
			font-size: $font-sm + 2upx;
			color: $font-color-light;

			.num {
				margin: 0 8upx;
				color: $font-color-dark;
			}

			.price {
				font-size: $font-lg;
				color: $font-color-dark;

				&:before {
					content: '￥';
					font-size: $font-sm;
					margin: 0 2upx 0 8upx;
				}
			}
		}

		.action-box {
			display: flex;
			justify-content: flex-end;
			align-items: center;
			height: 100upx;
			position: relative;
			padding-right: 30upx;
		}

		.action-btn {
			width: 160upx;
			height: 60upx;
			margin: 0;
			margin-left: 24upx;
			padding: 0;
			text-align: center;
			line-height: 60upx;
			font-size: $font-sm + 2upx;
			color: $font-color-dark;
			background: #fff;
			border-radius: 100px;

			&:after {
				border-radius: 100px;
			}

			&.recom {
				background: #fff9f9;
				color: $base-color;

				&:after {
					border-color: #f7bcc8;
				}
			}
		}
	}

	/* load-more */
	.uni-load-more {
		display: flex;
		flex-direction: row;
		height: 80upx;
		align-items: center;
		justify-content: center
	}

	.uni-load-more__text {
		font-size: 28upx;
		color: #999
	}

	.uni-load-more__img {
		height: 24px;
		width: 24px;
		margin-right: 10px
	}

	.uni-load-more__img>view {
		position: absolute
	}

	.uni-load-more__img>view view {
		width: 6px;
		height: 2px;
		border-top-left-radius: 1px;
		border-bottom-left-radius: 1px;
		background: #999;
		position: absolute;
		opacity: .2;
		transform-origin: 50%;
		animation: load 1.56s ease infinite
	}

	.uni-load-more__img>view view:nth-child(1) {
		transform: rotate(90deg);
		top: 2px;
		left: 9px
	}

	.uni-load-more__img>view view:nth-child(2) {
		transform: rotate(180deg);
		top: 11px;
		right: 0
	}

	.uni-load-more__img>view view:nth-child(3) {
		transform: rotate(270deg);
		bottom: 2px;
		left: 9px
	}

	.uni-load-more__img>view view:nth-child(4) {
		top: 11px;
		left: 0
	}

	.load1,
	.load2,
	.load3 {
		height: 24px;
		width: 24px
	}

	.load2 {
		transform: rotate(30deg)
	}

	.load3 {
		transform: rotate(60deg)
	}

	.load1 view:nth-child(1) {
		animation-delay: 0s
	}

	.load2 view:nth-child(1) {
		animation-delay: .13s
	}

	.load3 view:nth-child(1) {
		animation-delay: .26s
	}

	.load1 view:nth-child(2) {
		animation-delay: .39s
	}

	.load2 view:nth-child(2) {
		animation-delay: .52s
	}

	.load3 view:nth-child(2) {
		animation-delay: .65s
	}

	.load1 view:nth-child(3) {
		animation-delay: .78s
	}

	.load2 view:nth-child(3) {
		animation-delay: .91s
	}

	.load3 view:nth-child(3) {
		animation-delay: 1.04s
	}

	.load1 view:nth-child(4) {
		animation-delay: 1.17s
	}

	.load2 view:nth-child(4) {
		animation-delay: 1.3s
	}

	.load3 view:nth-child(4) {
		animation-delay: 1.43s
	}

	@-webkit-keyframes load {
		0% {
			opacity: 1
		}

		100% {
			opacity: .2
		}
	}
</style> 