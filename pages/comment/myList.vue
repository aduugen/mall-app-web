<template>
	<view class="content">
		<!-- 评价列表 -->
		<view class="list-section" v-if="commentList.length > 0">
			<view class="eva-box b-b" v-for="(comment, index) in commentList" :key="comment.id || index">
                <!-- 商品信息区域 -->
                <view class="product-info" @click="navToProductDetail(comment.productId)">
                    <image class="product-pic" :src="comment.productPic || '/static/errorImage.jpg'" mode="aspectFill"></image>
                    <view class="product-details">
                        <text class="product-name clamp">{{ comment.productName }}</text>
                        <text class="product-attr">{{ comment.productAttribute | formatProductAttr }}</text>
                    </view>
                </view>
                <!-- 评价内容区域 -->
				<view class="comment-content">
                    <view class="user-info">
                        <image class="portrait" :src="comment.memberIcon || '/static/missing-face.png'" mode="aspectFill"></image>
                        <text class="name">{{ comment.memberNickName }}</text>
                        <view class="star-line">
                            <text class="yticon icon-xingxing" v-for="n in 5" :key="n" :class="{ active: n <= comment.star }"></text>
                        </view>
                    </view>
					<text class="con">{{ comment.content }}</text>
					<view class="pic-list" v-if="comment.pics">
						<image v-for="(pic, picIndex) in formatCommentPics(comment.pics)" :key="picIndex"
							   :src="pic" mode="aspectFill" class="pic-item" @click="previewCommentImage(comment, picIndex)"></image>
					</view>
					<view class="bot">
						<text class="time">{{ comment.createTime | formatDateTime }}</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 空白页 -->
		<empty v-else-if="loadingType !== 'loading' && !loadingError"></empty>
        <!-- 加载错误提示 -->
        <view class="error-tip" v-if="loadingError">
            <text>加载失败，请稍后重试</text>
            <button @click="refreshData" size="mini">重试</button>
        </view>

		<!-- 加载更多 -->
		<uni-load-more :status="loadingType"></uni-load-more>

	</view>
</template>

<script>
	import { fetchMyCommentList } from '@/api/comment.js';
	import { formatDate } from '@/utils/date';
	import empty from "@/components/empty";
	import uniLoadMore from '@/components/uni-load-more/uni-load-more.vue';

	export default {
        components: { empty, uniLoadMore },
		data() {
			return {
				commentList: [],
                pageNum: 1,
                pageSize: 10,
                total: 0,
				loadingType: 'more', // 加载状态 more/loading/noMore
                loadingError: false // 是否加载出错
			}
		},
        onLoad(){
            this.loadData();
        },
        //下拉刷新
        onPullDownRefresh(){
            this.refreshData();
        },
        //加载更多
        onReachBottom(){
            this.loadData(true);
        },
		methods: {
            // 刷新数据
            refreshData(){
                this.pageNum = 1;
                this.commentList = [];
                this.loadingType = 'more';
                this.loadingError = false;
                this.loadData();
            },
			// 获取评价列表
			async loadData(loadMore = false){
                if (this.loadingType === 'loading' || (loadMore && this.loadingType === 'noMore')) {
                    return;
                }
                this.loadingType = 'loading';
                this.loadingError = false; // 重置错误状态

                try {
                    const response = await fetchMyCommentList({ 
                        pageNum: this.pageNum,
                        pageSize: this.pageSize
                    });

                    if (response.code === 200) {
                        const pageData = response.data;
                        if (loadMore) {
                            this.commentList = this.commentList.concat(pageData.list || []);
                        } else {
                            this.commentList = pageData.list || [];
                        }
                        this.total = pageData.total || 0;
                        
                        // 判断是否还有更多数据
                        if (this.commentList.length >= this.total) {
                            this.loadingType = 'noMore';
                        } else {
                            this.loadingType = 'more';
                            this.pageNum++; // 准备加载下一页
                        }
                        
                        if(!loadMore) {
                             uni.stopPullDownRefresh();
                        }

                    } else {
                        console.error("加载我的评价失败:", response.message);
                        this.loadingError = true;
                        this.loadingType = 'noMore'; // 出错时也标记为 noMore，避免无限加载
                        if(!loadMore) {
                             uni.stopPullDownRefresh();
                        }
                    }
                } catch (error) {
                    console.error("请求我的评价列表异常:", error);
                    this.loadingError = true;
                    this.loadingType = 'noMore';
                    if(!loadMore) {
                         uni.stopPullDownRefresh();
                    }
                }
			},
            // 跳转商品详情
            navToProductDetail(id) {
                if(!id) return;
                uni.navigateTo({ 
                    url: `/pages/product/product?id=${id}`
                });
            },
            // 格式化评价图片
            formatCommentPics(pics) {
                if (!pics) return [];
                return pics.split(',').filter(pic => pic.trim() !== '');
            },
            // 预览评价图片
            previewCommentImage(comment, index) {
                const urls = this.formatCommentPics(comment.pics);
                if (urls.length > 0) {
                    uni.previewImage({
                        current: index,
                        urls: urls
                    });
                }
            },
            // 通用跳转
            navTo(url){
				uni.navigateTo({
					url
				})
			}
		},
        filters: {
            // 格式化商品属性
            formatProductAttr(attr) {
                if(!attr) return '';
                try {
                    const attributes = JSON.parse(attr);
                    // 检查 attributes 是否为数组
                    if (Array.isArray(attributes)) {
                         return attributes.map(item => `${item.key}: ${item.value}`).join('; ');
                    } else {
                        // 如果不是数组，可能直接就是字符串或者其他格式，直接返回
                        return attr;
                    }
                } catch(e) {
                    // 解析失败，直接返回原始字符串
                    return attr;
                }
            },
            // 格式化日期时间过滤器 - 使用导入的 formatDate
            formatDateTime(time){
                if(time == null || time === ''){
                    return 'N/A';
                }
                let date = new Date(time);
                // Call the imported formatDate function with a specific format
                return formatDate(date, 'yyyy-MM-dd hh:mm:ss'); 
            }
        }
	}
</script>

<style lang="scss">
.content {
	background-color: #f8f8f8;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
}

.list-section {
	padding: 0 30rpx;
}

.eva-box {
	display: flex;
	flex-direction: column; // 改为列方向，先商品后评价
	padding: 20rpx 0;
	background-color: #fff;
    border-radius: 10rpx;
    margin-bottom: 20rpx; // 增加间距
    padding: 20rpx; // 内边距
	box-shadow: 0 1rpx 5rpx rgba(0, 0, 0, .08); // 添加轻微阴影

    &.b-b {
        border-bottom: none; // 移除底部边框，使用 margin 代替
    }
    
    .product-info {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx; // 增加与评价内容的间距
        padding-bottom: 20rpx;
        border-bottom: 1rpx solid #eee; // 添加分隔线

        .product-pic {
            width: 120rpx;
            height: 120rpx;
            border-radius: 8rpx;
            margin-right: 20rpx;
            flex-shrink: 0;
        }
        .product-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            .product-name {
                font-size: $font-base;
                color: $font-color-dark;
                line-height: 1.4;
            }
            .product-attr {
                font-size: $font-sm;
                color: $font-color-light;
                margin-top: 8rpx;
            }
        }
    }
    
    .comment-content {
        display: flex;
        flex-direction: column;
        flex: 1;

        .user-info {
            display: flex;
            align-items: center;
            margin-bottom: 16rpx;

            .portrait {
                width: 60rpx;
                height: 60rpx;
                border-radius: 50%;
                margin-right: 16rpx;
            }
            .name {
                font-size: $font-sm + 2upx;
                color: $font-color-dark;
                margin-right: 10rpx;
            }
            .star-line {
                display: flex;
                .yticon {
                    font-size: 30rpx;
                    margin-right: 6rpx;
                    color: #ddd; // 未点亮颜色
                    &.active {
                        color: $uni-color-warning; // 点亮颜色，使用 uni-app 警告色
                    }
                }
            }
        }

		.con {
			font-size: $font-base;
			color: $font-color-dark;
			padding: 10rpx 0;
			line-height: 1.5;
		}

		.pic-list {
			display: flex;
			flex-wrap: wrap;
            margin-top: 16rpx;
			.pic-item {
				width: 160rpx;
				height: 160rpx;
				margin-right: 16rpx;
				margin-bottom: 16rpx;
				border-radius: 8rpx;
                &:nth-child(3n) {
                    margin-right: 0;
                }
			}
		}

		.bot {
			display: flex;
			justify-content: space-between;
			font-size: $font-sm;
			color: $font-color-light;
            margin-top: 16rpx;
		}
	}
}

.error-tip {
    text-align: center;
    padding: 50rpx 0;
    font-size: $font-sm;
    color: $font-color-light;
    button {
        margin-top: 20rpx;
    }
}
</style> 