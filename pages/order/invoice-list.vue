<template>
	<view class="content">
		<view class="navbar">
			<view 
				v-for="(item, index) in navList" :key="index" 
				class="nav-item" 
				:class="{current: tabCurrentIndex === index}"
				@click="tabClick(index)"
			>
				{{item.text}}
			</view>
		</view>
		
		<swiper :current="tabCurrentIndex" class="swiper-box" duration="300" @change="changeTab">
			<swiper-item class="tab-content" v-for="(tabItem,tabIndex) in navList" :key="tabIndex">
				<scroll-view 
					class="list-scroll-content" 
					scroll-y
					@scrolltolower="loadData"
				>
					<!-- 空白页 -->
					<empty v-if="tabItem.invoiceList.length === 0"></empty>
					
					<!-- 发票列表 -->
					<view 
						v-for="(item, index) in tabItem.invoiceList" 
						:key="index"
						class="invoice-item"
					>
						<view class="i-top b-b">
							<text class="time">申请时间：{{formatDate(item.applyTime)}}</text>
							<text class="state" :style="{color: stateColor(item.status)}">{{stateName(item.status)}}</text>
							<text class="del-btn yticon icon-iconfontshanchu1" @click="deleteInvoice(index)" v-if="item.status === 2"></text>
						</view>
						<view class="i-content">
							<view class="i-info b-b">
								<view class="info-item">
									<text class="title">发票抬头:</text>
									<text class="content">{{item.invoiceTitle}}</text>
								</view>
								<view class="info-item" v-if="item.taxNumber">
									<text class="title">税号:</text>
									<text class="content">{{item.taxNumber}}</text>
								</view>
								<view class="info-item">
									<text class="title">发票内容:</text>
									<text class="content">{{item.invoiceContent}}</text>
								</view>
								<view class="info-item">
									<text class="title">发票金额:</text>
									<text class="content price">¥{{item.invoiceAmount}}</text>
								</view>
							</view>
							<view class="i-action">
								<view class="action-btn" @click="showInvoiceDetail(item.id)">
									查看详情
								</view>
							</view>
						</view>
					</view>
					
					<uni-load-more :status="tabItem.loadingType" v-if="tabItem.invoiceList.length > 0"></uni-load-more>
				</scroll-view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';
	import empty from "@/components/empty";
	import moment from 'moment';
	
	export default {
		components: {
			uniLoadMore,
			empty
		},
		data() {
			return {
				tabCurrentIndex: 0,
				navList: [
					{
						state: -1,
						text: '全部',
						loadingType: 'more',
						invoiceList: []
					},
					{
						state: 0,
						text: '待开票',
						loadingType: 'more',
						invoiceList: []
					},
					{
						state: 1,
						text: '已开票',
						loadingType: 'more',
						invoiceList: []
					},
					{
						state: 2,
						text: '开票失败',
						loadingType: 'more',
						invoiceList: []
					}
				],
				pageNum: 1,
				pageSize: 10
			};
		},
		onLoad(options){
			// 获取发票列表
			this.loadData();
		},
		methods: {
			// 格式化时间
			formatDate(date) {
				return moment(date).format('YYYY-MM-DD HH:mm:ss');
			},
			
			// 获取状态名称
			stateName(status) {
				let name = '';
				switch (status) {
					case 0:
						name = '待开票';
						break;
					case 1:
						name = '已开票';
						break;
					case 2:
						name = '开票失败';
						break;
					default:
						name = '未知状态';
				}
				return name;
			},
			
			// 获取状态颜色
			stateColor(status) {
				let color = '';
				switch (status) {
					case 0:
						color = '#909399';
						break;
					case 1:
						color = '#67C23A';
						break;
					case 2:
						color = '#F56C6C';
						break;
					default:
						color = '#909399';
				}
				return color;
			},
			
			// 顶部选项卡点击事件
			tabClick(index){
				this.pageNum = 1;
				this.tabCurrentIndex = index;
				this.loadData(true);
			},
			
			// 顶部选项卡滑动事件
			changeTab(e){
				this.pageNum = 1;
				this.tabCurrentIndex = e.target.current;
				this.loadData(true);
			},
			
			// 加载发票数据
			loadData(refresh = false){
				// 获取当前选项卡的状态和数据集合
				const currentTab = this.navList[this.tabCurrentIndex];
				
				// 如果是刷新则清空原有数据
				if(refresh){
					this.pageNum = 1;
					currentTab.invoiceList = [];
				}
				
				// 如果已经是最后一页则不加载
				if(currentTab.loadingType === 'noMore'){
					return;
				}
				
				// 设置为加载中状态
				currentTab.loadingType = 'loading';
				
				// 请求后台数据
				this.$api.request(
					'order/invoice/list', 
					'GET', 
					{
						status: currentTab.state,
						pageNum: this.pageNum,
						pageSize: this.pageSize
					}
				)
				.then(res => {
					if(res.data && res.data.code === 200){
						const data = res.data.data;
						// 添加数据
						currentTab.invoiceList = currentTab.invoiceList.concat(data.list);
						// 当前页是否是最后一页
						if(data.list.length < this.pageSize){
							currentTab.loadingType = 'noMore';
						}else{
							currentTab.loadingType = 'more';
							this.pageNum++;
						}
					} else {
						currentTab.loadingType = 'more';
						this.$api.msg(res.data.message || '获取发票列表失败');
					}
				})
				.catch(err => {
					console.error(err);
					currentTab.loadingType = 'more';
					this.$api.msg('获取发票列表失败');
				});
			},
			
			// 查看发票详情
			showInvoiceDetail(id){
				uni.navigateTo({
					url: `/pages/order/invoice-detail?id=${id}`
				});
			},
			
			// 删除发票申请记录
			deleteInvoice(index){
				uni.showModal({
					title: '提示',
					content: '是否删除该发票申请记录？',
					success: res => {
						if(res.confirm){
							const item = this.navList[this.tabCurrentIndex].invoiceList[index];
							// 接口调用，这里仅做演示，后续需要对接真实接口
							uni.showLoading({
								title: '处理中'
							});
							
							setTimeout(() => {
								this.navList[this.tabCurrentIndex].invoiceList.splice(index, 1);
								uni.hideLoading();
								uni.showToast({
									title: '删除成功'
								});
							}, 600);
						}
					}
				});
			}
		}
	}
</script>

<style lang="scss">
	.content {
		background-color: #f8f8f8;
		min-height: 100vh;
	}
	
	.navbar {
		display: flex;
		height: 80rpx;
		padding: 0 5px;
		background: #fff;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.06);
		position: relative;
		z-index: 10;
		
		.nav-item {
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;
			font-size: 28rpx;
			color: #303133;
			position: relative;
			
			&.current {
				color: #fa436a;
				
				&:after {
					content: '';
					position: absolute;
					left: 50%;
					bottom: 0;
					transform: translateX(-50%);
					width: 44rpx;
					height: 4rpx;
					background: linear-gradient(to right, #ff3456, #ff347d);
				}
			}
		}
	}
	
	.swiper-box {
		height: calc(100vh - 80rpx);
	}
	
	.list-scroll-content {
		height: 100%;
	}
	
	.invoice-item {
		margin: 20rpx;
		background-color: #fff;
		border-radius: 15rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
		overflow: hidden;
		
		.i-top {
			display: flex;
			align-items: center;
			font-size: 24rpx;
			color: #909399;
			padding: 20rpx 30rpx;
			
			.time {
				flex: 1;
			}
			
			.state {
				margin-right: 20rpx;
			}
			
			.del-btn {
				padding: 10rpx;
				font-size: 34rpx;
				color: #C0C4CC;
			}
		}
		
		.i-content {
			background-color: #fff;
			
			.i-info {
				padding: 20rpx 30rpx;
				
				.info-item {
					display: flex;
					margin-bottom: 15rpx;
					
					&:last-child {
						margin-bottom: 0;
					}
					
					.title {
						width: 160rpx;
						font-size: 26rpx;
						color: #909399;
					}
					
					.content {
						flex: 1;
						font-size: 26rpx;
						color: #303133;
						
						&.price {
							color: #fa436a;
							font-weight: 600;
						}
					}
				}
			}
			
			.i-action {
				display: flex;
				justify-content: flex-end;
				align-items: center;
				padding: 20rpx 30rpx;
				
				.action-btn {
					height: 60rpx;
					padding: 0 30rpx;
					border: 1rpx solid #fa436a;
					border-radius: 30rpx;
					color: #fa436a;
					font-size: 26rpx;
					display: flex;
					align-items: center;
					
					&:after {
						content: '';
						display: block;
						width: 10rpx;
						height: 10rpx;
						margin-left: 10rpx;
						border-top: 2rpx solid #fa436a;
						border-right: 2rpx solid #fa436a;
						transform: rotate(45deg);
					}
				}
			}
		}
	}
	
	.b-b {
		border-bottom: 1rpx solid #f2f2f2;
	}
</style> 