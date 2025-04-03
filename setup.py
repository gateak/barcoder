from setuptools import setup, find_packages

setup(
    name="barcoder",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "opencv-python>=4.8.0,<5.0.0",
        "pyzbar>=0.1.9",
        "PyQt5>=5.15.9",
        "pydrive2>=1.15.0",
    ],
    entry_points={
        'console_scripts': [
            'barcoder=barcoder.core.main:run_application',
        ],
    },
    author="",
    author_email="",
    description="Barcode Scanner and Image Capture Application",
    keywords="barcode, scanner, image, capture, google drive",
    python_requires=">=3.6",
    include_package_data=True,
    package_data={
        'barcoder': ['config/*', 'images/*'],
    },
)
