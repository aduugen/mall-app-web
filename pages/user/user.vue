<template>  
    <view class="container">  
		<view 
			class="cover-container"
			:style="[{
				transform: coverTransform,
				transition: coverTransition
			}]"
			@touchstart="coverTouchstart"
			@touchmove="coverTouchmove"
			@touchend="coverTouchend"
		>	
		<view class="user-section-top-rounded"></view>
		<view class="user-section">
			<view class="user-info-box">
				<view class="portrait-box">
					<image class="portrait" :src="userInfo.icon || '/static/missing-face.png'"></image>
				</view>
				<view class="info-box">
					<text class="username">{{userInfo.nickname || userInfo.username || '游客'}}</text>
					<view class="vip-tag">
						<text class="yticon icon-iLinkapp-"></text>
						<text>黄金会员</text>
					</view>
				</view>
			</view>
			
			<view class="user-stats-box">
				<view class="stat-item">
					<text class="num">{{userInfo.integration || '暂无'}}</text>
					<text class="label">积分</text>
				</view>
				<view class="stat-item">
					<text class="num">{{userInfo.growth || '暂无'}}</text>
					<text class="label">成长值</text>
				</view>
				<view class="stat-item" @click="navTo('/pages/coupon/couponList')">
					<text class="num">{{couponCount || '暂无'}}</text>
					<text class="label">优惠券</text>
				</view>
			</view>
		</view>	
			
			<!-- 订单 -->
			<view class="order-section">
				<view class="order-header">
					<text class="order-title">我的订单</text>
					<view class="order-all" @click="navTo('/pages/order/order?state=0')" hover-class="common-hover" :hover-stay-time="50">
						<text>全部订单</text>
					</view>
				</view>
				<view class="order-items">
					<view class="order-item" @click="navTo('/pages/order/order?state=1')" hover-class="common-hover" :hover-stay-time="50">
						<text class="yticon icon-daifahuo"></text>
						<text>待发货</text>
					</view>
					<view class="order-item" @click="navTo('/pages/order/order?state=1')"  hover-class="common-hover" :hover-stay-time="50">
						<text class="yticon icon-daifukuan"></text>
						<text>待付款</text>
					</view>
					<view class="order-item" @click="navTo('/pages/order/order?state=2')" hover-class="common-hover"  :hover-stay-time="50">
						<text class="yticon icon-yishouhuo"></text>
						<text>待收货</text>
					</view>
					<view class="order-item" @click="navTo('/pages/order/order?state=4')" hover-class="common-hover"  :hover-stay-time="50">
						<text class="yticon icon-shouhoutuikuan"></text>
						<text>已完成</text>
					</view>
				</view>
			</view>
			<!-- 浏览历史 -->
			<view class="history-section icon">
				<list-cell icon="icon-dizhi" iconColor="#286090" title="地址管理" @eventClick="navTo('/pages/address/address')"></list-cell>
				<list-cell icon="icon-lishijilu" iconColor="#286090" title="我的足迹" @eventClick="navTo('/pages/user/readHistory')"></list-cell>
				<list-cell icon="icon-shoucang" iconColor="#286090" title="我的关注" @eventClick="navTo('/pages/user/brandAttention')"></list-cell>
				<list-cell icon="icon-shoucang_xuanzhongzhuangtai" iconColor="#286090" title="我的收藏" @eventClick="navTo('/pages/user/productCollection')"></list-cell>
				<list-cell icon="icon-dianzan-ash" iconColor="#286090" title="我的评价"></list-cell>
				<list-cell icon="icon-shezhi1" iconColor="#286090" title="设置" border="" @eventClick="navTo('/pages/set/set')"></list-cell>
				
				<button class="logout-btn" @click="logout" v-if="hasLogin">退出登录</button>
			</view>
		</view>
			
		
    </view>  
</template>  
<script>  
	import listCell from '@/components/mix-list-cell';
	import {
		fetchMemberCouponList
	} from '@/api/coupon.js';
    import {  
        mapState,
		mapMutations
    } from 'vuex';  
	let startY = 0, moveY = 0, pageAtTop = true;
    export default {
		components: {
			listCell
		},
		data(){
			return {
				coverTransform: 'translateY(0px)',
				coverTransition: '0s',
				moving: false,
				couponCount:null
			}
		},
		onLoad(){
		},
		onShow(){
			if(this.hasLogin){
				fetchMemberCouponList(0).then(response=>{
					if(response.data!=null&&response.data.length>0){
						this.couponCount = response.data.length;
					}
				});
			}else{
				this.couponCount=null;
			}
		},
		// #ifndef MP
		onNavigationBarButtonTap(e) {
			const index = e.index;
			if (index === 0) {
				this.navTo('/pages/set/set');
			}else if(index === 1){
				// #ifdef APP-PLUS
				const pages = getCurrentPages();
				const page = pages[pages.length - 1];
				const currentWebview = page.$getAppWebview();
				currentWebview.hideTitleNViewButtonRedDot({
					index
				});
				// #endif
				uni.navigateTo({
					url: '/pages/notice/notice'
				})
			}
		},
		// #endif
        computed: {
			...mapState(['hasLogin','userInfo'])
		},
        methods: {
			...mapMutations(['login', 'logout']),
			
			/**
			 * 退出登录
			 */
			logout(){
				uni.showModal({
					title: '提示',
					content: '确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							this.logout();
							uni.showToast({
								title: '退出成功'
							});
							setTimeout(() => {
								this.navTo('/pages/public/login');
							}, 1500);
						}
					}
				});
			},
			/**
			 * 统一跳转接口,拦截未登录路由
			 * navigator标签现在默认没有转场动画，所以用view
			 */
			navTo(url){
				if(!this.hasLogin){
					url = '/pages/public/login';
				}
				uni.navigateTo({  
					url
				})  
			}, 
	
			/**
			 *  会员卡下拉和回弹
			 *  1.关闭bounce避免ios端下拉冲突
			 *  2.由于touchmove事件的缺陷（以前做小程序就遇到，比如20跳到40，h5反而好很多），下拉的时候会有掉帧的感觉
			 *    transition设置0.1秒延迟，让css来过渡这段空窗期
			 *  3.回弹效果可修改曲线值来调整效果，推荐一个好用的bezier生成工具 http://cubic-bezier.com/
			 */
			coverTouchstart(e){
				if(pageAtTop === false){
					return;
				}
				this.coverTransition = 'transform .1s linear';
				startY = e.touches[0].clientY;
			},
			coverTouchmove(e){
				moveY = e.touches[0].clientY;
				let moveDistance = moveY - startY;
				if(moveDistance < 0){
					this.moving = false;
					return;
				}
				this.moving = true;
				if(moveDistance >= 80 && moveDistance < 100){
					moveDistance = 80;
				}
		
				if(moveDistance > 0 && moveDistance <= 80){
					this.coverTransform = `translateY(${moveDistance}px)`;
				}
			},
			coverTouchend(){
				if(this.moving === false){
					return;
				}
				this.moving = false;
				this.coverTransition = 'transform 0.3s cubic-bezier(.21,1.93,.53,.64)';
				this.coverTransform = 'translateY(0px)';
			}
        }  
    }  
</script>  
<style lang='scss'>
	%flex-center {
	 display:flex;
	 flex-direction: column;
	 justify-content: center;
	 align-items: center;
	}
	%section {
	  display:flex;
	  justify-content: space-around;
	  align-content: center;
	  background: #fff;
	  border-radius: 10upx;
	}

	.user-section{
    height: 350upx;
    padding: 60upx 30upx 30upx; /* 减小顶部内边距 */
    position:relative;
    background: linear-gradient(to top, #f8faf9, #286090); /* 渐变深蓝色背景 */
    border-radius: 15upx; /* 四周圆角 */
    box-shadow: 0 5upx 15upx rgba(0, 0, 0, 0.2); /* 添加阴影 */
    margin: 20upx 0; /* 添加上下边距 */
}
	.user-stats-box {
		position: absolute;
		top: 70%;
		left: 45upx;
		transform: translateY(-50%);
		background-color: rgba(255, 255, 255, 0.2);
		padding: 15upx;
		border-radius: 10upx;
		display: flex;
		flex-direction: row;
		
		.stat-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-left: 20upx;
			
			.num {
				font-size: 28upx;
				color: #fff;
				font-weight: bold;
			}
			
			.label {
				font-size: 24upx;
				color: rgba(255, 255, 255, 0.8);
				margin-top: 4upx;
			}
		}
	}
	.user-info-box{
		height: 100upx;
		display: flex;
		align-items: center;
		position: relative;
		z-index: 1;
		padding-top: 0upx;
		padding-left: 20upx;
		margin-bottom: 5upx;
		margin-top: -10upx;
		.portrait{
			width: 80upx;
			height: 80upx;
			border: 3upx solid #fff;
			border-radius: 50%;
		}
		.info-box {
			display: flex;
			flex-direction: column;
			
			.username{
				font-size: $font-lg;
				color: #fff;
				margin-left: 15upx;
				text-shadow: 0 0 5upx rgba(0, 0, 0, 0.3);
				font-weight: bold;
				margin-bottom: 5upx;
			}
			
			.vip-tag {
				margin-left: 15upx;
				background: linear-gradient(left, rgba(0,0,0,.7), rgba(0,0,0,.8));
				border-radius: 15upx;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 3upx 10upx;
				width: 140upx;
				font-size: 22upx;
				color: #f7d680;
				
				.yticon {
					color: #f6e5a3;
					margin-right: 8upx;
					font-size: 22upx;
				}
			}
		}
	}

	.vip-card-box{
		display: none; /* 隐藏不需要的样式 */
	}

	.cover-container{
		background: $page-color-base;
		margin-top: 0upx;
		padding: 0 30upx;
		position:relative;
		background: #f5f5f5;
		padding-bottom: 20upx;
		.arc{
			position:absolute;
			left: 0;
			top: -34upx;
			width: 100%;
			height: 36upx;
		}
	}
	.tj-sction{
		@extend %section;
		margin-top: 30upx;
		.tj-item{
			@extend %flex-center;
			flex-direction: column;
			height: 140upx;
			font-size: $font-sm;
			color: #75787d;
		}
		.num{
			font-size: $font-lg;
			color: $font-color-dark;
			margin-bottom: 8upx;
		}
	}
	.order-section{
		@extend %section;
		padding: 28upx 0;
		margin-top: 20upx;
		flex-direction: column;
		
		.order-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			width: 100%;
			padding: 0 30upx;
			margin-bottom: 20upx;
			
			.order-title {
				font-size: $font-sm;
				color: $font-color-dark;
			}
			
			.order-all {
				font-size: $font-sm;
				color: $font-color-dark;
			}
		}
		
		.order-items {
			display: flex;
			justify-content: space-around;
			width: 100%;
		}
		
		.order-item{
			@extend %flex-center;
			width: 120upx;
			height: 120upx;
			border-radius: 10upx;
			font-size: $font-sm;
			color: $font-color-dark;
		}
		.yticon{
			font-size: 48upx;
			margin-bottom: 18upx;
			color: #286090;
		}
		.icon-shouhoutuikuan{
			font-size:44upx;
		}
	}
	.history-section{
		padding: 30upx 0 0;
		margin-top: 20upx;
		background: #fff;
		border-radius:10upx;
		.sec-header{
			display:flex;
			align-items: center;
			font-size: $font-base;
			color: $font-color-dark;
			line-height: 40upx;
			margin-left: 30upx;
			.yticon{
				font-size: 44upx;
				color: #5eba8f;
				margin-right: 16upx;
				line-height: 40upx;
			}
		}
		.h-list{
			white-space: nowrap;
			padding: 30upx 30upx 0;
			image{
				display:inline-block;
				width: 160upx;
				height: 160upx;
				margin-right: 20upx;
				border-radius: 10upx;
			}
		}
	}
	.logout-btn {
		height: 66upx;
		line-height: 66upx;
		border-radius: 100upx;
		background-color: #286090;
		color: #fff;
		font-size: $font-base;
		width: 50%;
		margin: 60upx auto 20upx;
	}
	
	.icon-container {
		position: relative;
		width: 48upx;
		height: 48upx;
		margin-bottom: 18upx;
	}
</style>