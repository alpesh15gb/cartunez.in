import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class GalleryItemBase(BaseModel):
    title: str
    image: str
    category: str
    vehicle: str

class GalleryItemCreate(GalleryItemBase):
    pass

class GalleryItemResponse(BaseModel):
    id: uuid.UUID
    title: str
    image_url: str = ""
    category: str
    vehicle: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

