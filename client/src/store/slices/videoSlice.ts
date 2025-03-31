import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Video, InsertVideo } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Video sahnesi için interface
interface VideoScene {
  id: number;
  text_segment: string;
  visual_description: string;
  enhanced_description?: string;
  imageUrl?: string;
  startTime?: number;
  endTime?: number;
  style?: string;
}

// Video oluşturma için genişletilmiş VideoData interface'i
interface VideoData extends Omit<InsertVideo, 'sections'> {
  sections?: any;
  scenes?: VideoScene[];
}

interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  loading: boolean;
  error: string | null;
}

const initialState: VideoState = {
  videos: [],
  currentVideo: null,
  loading: false,
  error: null
};

// Async thunks
export const fetchUserVideos = createAsyncThunk(
  "video/fetchUserVideos",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiRequest("GET", "/api/videos");
      return await res.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Videolar alınamadı");
    }
  }
);

export const fetchVideoById = createAsyncThunk(
  "video/fetchVideoById",
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await apiRequest("GET", `/api/videos/${id}`);
      return await res.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Video alınamadı");
    }
  }
);

export const createVideo = createAsyncThunk(
  "video/createVideo",
  async (videoData: VideoData, { rejectWithValue }) => {
    try {
      // Sahneleri işle: Sahneler varsa sections olarak ekle
      const processedData: InsertVideo = {
        ...videoData,
        sections: videoData.scenes ? JSON.stringify(videoData.scenes) : (videoData.sections ? JSON.stringify(videoData.sections) : null)
      };
      
      // Video oluşturma isteği
      const res = await apiRequest("POST", "/api/videos", processedData);
      
      if (!res.ok) {
        throw new Error("Video oluşturma başarısız oldu");
      }
      
      const video = await res.json();
      
      // Video işleme başlat (asenkron)
      if (video && video.id) {
        // API'da video işleme zamanlaması ayarla
        try {
          await apiRequest("POST", "/api/ai/create-video", {
            videoId: video.id,
            scenes: videoData.scenes,
            videoOptions: {
              format: videoData.format,
              resolution: videoData.resolution,
              duration: videoData.duration,
              aiModel: videoData.aiModel || "stable_diffusion_xl"
            }
          });
        } catch (processingError) {
          console.error("Video işleme başlatılırken hata:", processingError);
          // İşleme başlatılamasa bile, video kaydedildiği için hata gösterme
        }
      }
      
      return video;
    } catch (error: any) {
      return rejectWithValue(error.message || "Video oluşturulamadı");
    }
  }
);

export const deleteVideo = createAsyncThunk(
  "video/deleteVideo",
  async (id: number, { rejectWithValue }) => {
    try {
      await apiRequest("DELETE", `/api/videos/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || "Video silinemedi");
    }
  }
);

// Slice
const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    clearVideoError: (state) => {
      state.error = null;
    },
    setCurrentVideo: (state, action: PayloadAction<Video | null>) => {
      state.currentVideo = action.payload;
    },
    updateVideoStatus: (state, action: PayloadAction<{ id: number; status: string; videoUrl?: string; thumbnailUrl?: string }>) => {
      const { id, status, videoUrl, thumbnailUrl } = action.payload;
      
      // Update in videos array
      state.videos = state.videos.map(video => {
        if (video.id === id) {
          return { 
            ...video, 
            status, 
            videoUrl: videoUrl || video.videoUrl, 
            thumbnailUrl: thumbnailUrl || video.thumbnailUrl 
          };
        }
        return video;
      });
      
      // Update current video if it's the same
      if (state.currentVideo && state.currentVideo.id === id) {
        state.currentVideo = { 
          ...state.currentVideo, 
          status, 
          videoUrl: videoUrl || state.currentVideo.videoUrl, 
          thumbnailUrl: thumbnailUrl || state.currentVideo.thumbnailUrl 
        };
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch User Videos
    builder.addCase(fetchUserVideos.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserVideos.fulfilled, (state, action) => {
      state.loading = false;
      state.videos = action.payload;
    });
    builder.addCase(fetchUserVideos.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch Video By Id
    builder.addCase(fetchVideoById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchVideoById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentVideo = action.payload;
    });
    builder.addCase(fetchVideoById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Create Video
    builder.addCase(createVideo.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createVideo.fulfilled, (state, action) => {
      state.loading = false;
      state.videos = [action.payload, ...state.videos];
      state.currentVideo = action.payload;
    });
    builder.addCase(createVideo.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Delete Video
    builder.addCase(deleteVideo.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteVideo.fulfilled, (state, action) => {
      state.loading = false;
      state.videos = state.videos.filter(video => video.id !== action.payload);
      if (state.currentVideo && state.currentVideo.id === action.payload) {
        state.currentVideo = null;
      }
    });
    builder.addCase(deleteVideo.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { clearVideoError, setCurrentVideo, updateVideoStatus } = videoSlice.actions;
export default videoSlice.reducer;
