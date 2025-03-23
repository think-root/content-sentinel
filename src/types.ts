export interface Repository {
  id: number;
  posted: boolean;
  url: string;
  text: string;
  date_added?: string;
  date_posted?: string;
}

export interface RepositoriesResponse {
  status: string;
  message: string;
  data: {
    all: number;
    posted: number;
    unposted: number;
    items: Repository[];
  };
}

export interface GenerateResponse {
  status: string;
  added: string[];
  dont_added: string[];
}

export interface UpdatePostedResponse {
  status: string;
  message: string;
}