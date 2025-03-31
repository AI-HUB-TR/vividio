import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Video } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Tip tanımları
export interface VideoData {
  userId: number;
  title: string;
  originalText: string;
  format: string;
  duration: number;
  resolution: string;
  sections?: any;
  aiModel?: string;
  status?: string;
}

interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  loading: boolean;
  error: string | null;
  scenes: any[];
  processingStatus: {
    status: string;
    progress: number;
  };
}

// İlk durum
const initialState: VideoState = {
  videos: [],
  currentVideo: null,
  loading: false,
  error: null,
  scenes: [],
  processingStatus: {
    status: 'idle',
    progress: 0,
  },
};

// Asenkron eylemler
export const fetchUserVideos = createAsyncThunk('videos/fetchUserVideos', async () => {
  const response = await apiRequest('GET', '/api/videos');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Videolar yüklenirken bir hata oluştu');
  }
  
  return response.json();
});

export const fetchVideoById = createAsyncThunk('videos/fetchVideoById', async (videoId: number) => {
  const response = await apiRequest('GET', `/api/videos/${videoId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Video yüklenirken bir hata oluştu');
  }
  
  return response.json();
});

export const createVideo = createAsyncThunk('videos/createVideo', async (videoData: VideoData) => {
  const response = await apiRequest('POST', '/api/videos', videoData);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Video oluşturulurken bir hata oluştu');
  }
  
  return response.json();
});

export const deleteVideo = createAsyncThunk('videos/deleteVideo', async (videoId: number) => {
  const response = await apiRequest('DELETE', `/api/videos/${videoId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Video silinirken bir hata oluştu');
  }
  
  return videoId;
});

export const generateVideoScenes = createAsyncThunk(
  'videos/generateScenes',
  async ({ text, sceneCount }: { text: string; sceneCount: number }) => {
    const response = await apiRequest('POST', '/api/ai/generate-scenes', {
      text,
      sceneCount,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sahneler oluşturulurken bir hata oluştu');
    }
    
    return response.json();
  }
);

export const generateSceneImage = createAsyncThunk(
  'videos/generateSceneImage', 
  async ({ description, style }: { description: string, style: string }) => {
    const response = await apiRequest('POST', '/api/ai/generate-image', {
      description,
      style,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Görsel oluşturulurken bir hata oluştu');
    }
    
    return response.json();
  }
);

export const enhanceScenes = createAsyncThunk(
  'videos/enhanceScenes',
  async ({ scenes, useGrok }: { scenes: any[], useGrok: boolean }) => {
    const response = await apiRequest('POST', '/api/ai/enhance-scenes', {
      scenes,
      useGrok,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sahneler iyileştirilirken bir hata oluştu');
    }
    
    return response.json();
  }
);

export const createAIVideo = createAsyncThunk(
  'videos/createAIVideo',
  async (videoData: { scenes: any[], videoOptions: any }) => {
    const response = await apiRequest('POST', '/api/ai/create-video', videoData);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Video oluşturulurken bir hata oluştu');
    }
    
    return response.json();
  }
);

export const checkVideoStatus = createAsyncThunk(
  'videos/checkStatus',
  async (videoId: number) => {
    const response = await apiRequest('GET', `/api/ai/video-status/${videoId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Video durumu kontrol edilirken bir hata oluştu');
    }
    
    return response.json();
  }
);

// Video slice
const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setScenes: (state, action: PayloadAction<any[]>) => {
      state.scenes = action.payload;
    },
    updateScene: (state, action: PayloadAction<{ index: number; scene: any }>) => {
      const { index, scene } = action.payload;
      if (state.scenes[index]) {
        state.scenes[index] = { ...state.scenes[index], ...scene };
      }
    },
    updateVideoStatus: (state, action: PayloadAction<{ 
      id: number;
      status: string;
      videoUrl?: string;
      thumbnailUrl?: string;
    }>) => {
      const { id, status, videoUrl, thumbnailUrl } = action.payload;
      
      // Eğer aktif bir video varsa güncelle
      if (state.currentVideo && state.currentVideo.id === id) {
        state.currentVideo = {
          ...state.currentVideo,
          status,
          ...(videoUrl && { videoUrl }),
          ...(thumbnailUrl && { thumbnailUrl }),
        };
      }
      
      // Listede varsa güncelle
      state.videos = state.videos.map(video => {
        if (video.id === id) {
          return {
            ...video,
            status,
            ...(videoUrl && { videoUrl }),
            ...(thumbnailUrl && { thumbnailUrl }),
          };
        }
        return video;
      });
    },
    resetScenes: (state) => {
      state.scenes = [];
    },
    setProcessingStatus: (state, action: PayloadAction<{ status: string; progress: number }>) => {
      state.processingStatus = action.payload;
    },
    clearCurrentVideo: (state) => {
      state.currentVideo = null;
    },
  },
  extraReducers: (builder) => {
    // Kullanıcı videolarını çekme
    builder
      .addCase(fetchUserVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload;
      })
      .addCase(fetchUserVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Videolar yüklenirken bir hata oluştu';
      });
    
    // Belirli bir videoyu çekme
    builder
      .addCase(fetchVideoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVideo = action.payload;
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Video yüklenirken bir hata oluştu';
      });
    
    // Video oluşturma
    builder
      .addCase(createVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.videos.push(action.payload);
        state.currentVideo = action.payload;
      })
      .addCase(createVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Video oluşturulurken bir hata oluştu';
      });
    
    // Video silme
    builder
      .addCase(deleteVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = state.videos.filter(video => video.id !== action.payload);
        if (state.currentVideo && state.currentVideo.id === action.payload) {
          state.currentVideo = null;
        }
      })
      .addCase(deleteVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Video silinirken bir hata oluştu';
      });
    
    // Sahneleri üretme
    builder
      .addCase(generateVideoScenes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateVideoScenes.fulfilled, (state, action) => {
        state.loading = false;
        state.scenes = action.payload;
      })
      .addCase(generateVideoScenes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Sahneler oluşturulurken bir hata oluştu';
      });
    
    // Sahne görseli oluşturma
    builder
      .addCase(generateSceneImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateSceneImage.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(generateSceneImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Görsel oluşturulurken bir hata oluştu';
      });
    
    // Sahneleri iyileştirme
    builder
      .addCase(enhanceScenes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(enhanceScenes.fulfilled, (state, action) => {
        state.loading = false;
        state.scenes = action.payload;
      })
      .addCase(enhanceScenes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Sahneler iyileştirilirken bir hata oluştu';
      });
    
    // AI Video oluşturma
    builder
      .addCase(createAIVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAIVideo.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.video) {
          state.videos.push(action.payload.video);
          state.currentVideo = action.payload.video;
        }
      })
      .addCase(createAIVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Video oluşturulurken bir hata oluştu';
      });
    
    // Video durumunu kontrol etme
    builder
      .addCase(checkVideoStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkVideoStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.processingStatus) {
          state.processingStatus = action.payload.processingStatus;
        }
        
        // Eğer video tamamlandıysa, video url'sini güncelle
        if (action.payload.video && action.payload.processingStatus.status === 'completed') {
          const { video } = action.payload;
          
          // Listedeki video bilgilerini güncelle
          state.videos = state.videos.map(v => {
            if (v.id === video.id) {
              return {
                ...v,
                status: 'completed',
                videoUrl: video.videoUrl,
                thumbnailUrl: video.thumbnailUrl
              };
            }
            return v;
          });
          
          // Eğer aktif video buysa, onu da güncelle
          if (state.currentVideo && state.currentVideo.id === video.id) {
            state.currentVideo = {
              ...state.currentVideo,
              status: 'completed',
              videoUrl: video.videoUrl,
              thumbnailUrl: video.thumbnailUrl
            };
          }
        }
      })
      .addCase(checkVideoStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Video durumu kontrol edilirken bir hata oluştu';
      });
  }
});

export const { 
  setScenes, 
  updateScene, 
  resetScenes, 
  updateVideoStatus,
  setProcessingStatus,
  clearCurrentVideo
} = videoSlice.actions;

export default videoSlice.reducer;